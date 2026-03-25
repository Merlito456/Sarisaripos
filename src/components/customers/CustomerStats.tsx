import React from 'react';
import { Users, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { type CustomerSummary } from '../../types/customer';
import { useCustomer } from '../../hooks/useCustomer';

interface CustomerStatsProps {
  summary: CustomerSummary | null;
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ summary }) => {
  const { formatBalance } = useCustomer();

  const stats = [
    {
      title: 'Total Customers',
      value: summary?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100'
    },
    {
      title: 'Total Receivables',
      value: formatBalance(summary?.totalReceivables || 0),
      icon: Wallet,
      color: 'bg-rose-600',
      shadow: 'shadow-rose-100'
    },
    {
      title: 'Active Customers',
      value: summary?.activeCustomers || 0,
      icon: TrendingUp,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-100'
    },
    {
      title: 'Overdue Accounts',
      value: summary?.overdueCustomers?.length || 0,
      icon: AlertCircle,
      color: 'bg-amber-600',
      shadow: 'shadow-amber-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-3xl shadow-sm p-6 border border-stone-200 group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg ${stat.shadow} transition-transform`}>
              <stat.icon size={24} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.title}</p>
          <p className="text-2xl font-black text-stone-900 tracking-tight">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};
