import React from 'react';
import { TrendingUp, ShoppingBag, Users, Wallet } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

export const SalesSummary: React.FC = () => {
  const { salesData, formatCurrency, getDateRangeText } = useReports();
  
  const totalSales = salesData.reduce((sum, d) => sum + d.totalSales, 0);
  const totalTransactions = salesData.reduce((sum, d) => sum + d.transactionCount, 0);
  const averageTicket = totalTransactions ? totalSales / totalTransactions : 0;
  const totalProfit = salesData.reduce((sum, d) => sum + d.totalProfit, 0);
  const profitMargin = totalSales ? (totalProfit / totalSales) * 100 : 0;
  
  const stats = [
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales),
      icon: ShoppingBag,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-100',
      trend: '+12.5%'
    },
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-100',
      trend: '+8.3%'
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: Users,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100',
      trend: '+5.2%'
    },
    {
      title: 'Average Ticket',
      value: formatCurrency(averageTicket),
      icon: Wallet,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-100',
      trend: profitMargin > 0 ? `${profitMargin.toFixed(1)}% margin` : ''
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase">Sales Summary</h3>
          <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">{getDateRangeText()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-3xl shadow-sm p-6 border border-stone-200 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.title}</p>
            <p className="text-2xl font-black text-stone-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
