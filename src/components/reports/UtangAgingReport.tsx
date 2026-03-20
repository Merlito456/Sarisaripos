import React from 'react';
import { AlertCircle, Users, Wallet, Clock } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

export const UtangAgingReport: React.FC = () => {
  const { utangAging, formatCurrency } = useReports();
  
  if (!utangAging) return null;
  
  const agingData = [
    { label: '0-30 days', amount: utangAging.current, color: 'bg-emerald-500' },
    { label: '31-60 days', amount: utangAging.aging31to60, color: 'bg-amber-500' },
    { label: '61-90 days', amount: utangAging.aging61to90, color: 'bg-orange-500' },
    { label: '90+ days', amount: utangAging.aging91plus, color: 'bg-rose-500' }
  ];
  
  const maxAmount = Math.max(...agingData.map(d => d.amount));
  
  return (
    <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
      <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Utang Aging Report</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Receivables</p>
            <p className="text-3xl font-black text-indigo-900 tracking-tight">
              {formatCurrency(utangAging.totalReceivables)}
            </p>
          </div>
          <Wallet size={40} className="text-indigo-200" />
        </div>
        
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Customers with Utang</p>
            <p className="text-3xl font-black text-blue-900 tracking-tight">
              {utangAging.customersWithUtang}
            </p>
          </div>
          <Users size={40} className="text-blue-200" />
        </div>
        
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Highest Balance</p>
            <p className="text-xl font-black text-amber-900 tracking-tight truncate max-w-[150px]">
              {utangAging.highestBalance.customerName}
            </p>
            <p className="text-sm font-black text-amber-600">
              {formatCurrency(utangAging.highestBalance.balance)}
            </p>
          </div>
          <AlertCircle size={40} className="text-amber-200" />
        </div>
      </div>
      
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Aging Breakdown</h4>
        {agingData.map((item, index) => {
          const width = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-stone-600 uppercase tracking-tight">{item.label}</span>
                <span className="font-black text-stone-900 tracking-tight">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {utangAging.aging91plus > 0 && (
        <div className="mt-12 p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-start space-x-4">
          <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-lg font-black text-rose-900 tracking-tight uppercase">Overdue Accounts Alert</p>
            <p className="text-sm font-bold text-rose-600 mt-1">
              You have {formatCurrency(utangAging.aging91plus)} in accounts overdue by more than 90 days.
              Consider contacting these customers for collection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
