import React from 'react';
import { Package, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

export const InventoryReport: React.FC = () => {
  const { inventoryReport, formatCurrency } = useReports();
  
  if (!inventoryReport) return null;
  
  const stats = [
    {
      title: 'Total Inventory Value',
      value: formatCurrency(inventoryReport.totalValue),
      icon: Package,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-100'
    },
    {
      title: 'Low Stock Items',
      value: inventoryReport.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-100'
    },
    {
      title: 'Out of Stock',
      value: inventoryReport.outOfStockItems,
      icon: XCircle,
      color: 'bg-rose-600',
      shadow: 'shadow-rose-100'
    },
    {
      title: 'Slow Moving Items',
      value: inventoryReport.slowMovingItems.length,
      icon: TrendingDown,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100'
    }
  ];
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-3xl shadow-sm p-6 border border-stone-200 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.title}</p>
            <p className="text-2xl font-black text-stone-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
          <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Category Value</h3>
          <div className="space-y-6">
            {inventoryReport.categories.map((cat, index) => {
              const totalValue = inventoryReport.totalValue;
              const percentage = totalValue > 0 ? (cat.totalValue / totalValue) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-stone-600 uppercase tracking-tight">{cat.category}</span>
                    <span className="font-black text-stone-900 tracking-tight">
                      {formatCurrency(cat.totalValue)}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
          <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Slow Moving Items</h3>
          <div className="space-y-4">
            {inventoryReport.slowMovingItems.length === 0 ? (
              <p className="text-center py-12 text-stone-400 font-medium">No slow moving items detected. Everything is moving! 🚀</p>
            ) : (
              inventoryReport.slowMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div>
                    <p className="font-black text-stone-900 tracking-tight">{item.productName}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{item.daysInStock} days in stock</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Sold</p>
                    <p className="font-black text-stone-900 tracking-tight">{item.quantitySold}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
