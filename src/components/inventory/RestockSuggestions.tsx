import React, { useEffect, useState } from 'react';
import { db } from '../../database/db';
import { TrendingUp, Package, AlertCircle } from 'lucide-react';

interface SoldItem {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  lastSoldDate: Date;
}

export const RestockSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SoldItem[]>([]);
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [period]);

  const loadSuggestions = async () => {
    setLoading(true);
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Get all transactions in period
      const transactions = await db.transactions
        .where('timestamp')
        .above(startDate)
        .toArray();

      if (transactions.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get all transaction items for these transactions in one go
      const transactionIds = transactions.map(tx => tx.id).filter((id): id is string => !!id);
      const allItems = await db.transactionItems
        .where('transactionId')
        .anyOf(transactionIds)
        .toArray();

      // Aggregate sales by product
      const salesMap = new Map<string, { quantity: number; revenue: number; lastDate: Date }>();
      
      // Create a map for quick timestamp lookup
      const txTimestampMap = new Map(transactions.map(tx => [tx.id, tx.timestamp]));

      for (const item of allItems) {
        const timestamp = txTimestampMap.get(item.transactionId);
        if (!timestamp) continue;

        const existing = salesMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
          if (timestamp > existing.lastDate) existing.lastDate = timestamp;
        } else {
          salesMap.set(item.productId, {
            quantity: item.quantity,
            revenue: item.subtotal,
            lastDate: timestamp,
          });
        }
      }

      // Get product names
      const products = await db.products.toArray();
      const productMap = new Map(products.map(p => [p.id, p.name]));

      const suggestionsList: SoldItem[] = Array.from(salesMap.entries()).map(([id, data]) => ({
        productId: id,
        productName: productMap.get(id) || 'Unknown Product',
        quantitySold: data.quantity,
        totalRevenue: data.revenue,
        lastSoldDate: data.lastDate,
      }));

      // Sort by quantity sold (highest first)
      suggestionsList.sort((a, b) => b.quantitySold - a.quantitySold);
      setSuggestions(suggestionsList.slice(0, 20)); // top 20
    } catch (error) {
      console.error('Failed to load restock suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight flex items-center">
          <TrendingUp className="w-6 h-6 text-emerald-500 mr-2" />
          Restock Suggestions
        </h3>
        <div className="flex bg-stone-100 p-1 rounded-xl">
          {(['7days', '30days', '90days'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {p === '7days' ? '7D' : p === '30days' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Analyzing sales velocity...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
          <Package className="w-12 h-12 mx-auto mb-4 text-stone-200" />
          <p className="text-stone-500 font-bold">No sales data found for this period.</p>
          <p className="text-stone-400 text-xs mt-1">Start selling to see restock suggestions!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Product</th>
                <th className="py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Qty Sold</th>
                <th className="py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Revenue</th>
                <th className="py-3 px-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Last Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {suggestions.map((item) => (
                <tr key={item.productId} className="hover:bg-stone-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-stone-800">{item.productName}</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-black text-indigo-600">{item.quantitySold}</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="font-bold text-stone-800">₱{item.totalRevenue.toFixed(2)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-stone-400 font-medium">
                      {new Date(item.lastSoldDate).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 flex items-start p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <AlertCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium leading-relaxed">
          <strong>Smart Tip:</strong> These suggestions are based on your actual sales velocity. 
          Items at the top are your best-sellers—consider restocking them first to avoid missing out on sales!
        </p>
      </div>
    </div>
  );
};
