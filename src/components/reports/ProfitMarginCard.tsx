import React from 'react';
import { useReports } from '../../hooks/useReports';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export const ProfitMarginCard: React.FC = () => {
  const { profitAnalysis, formatCurrency } = useReports();
  
  if (!profitAnalysis) return null;
  
  return (
    <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
      <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Profit Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-40 h-40">
            <CircularProgressbar
              value={profitAnalysis.profitMargin}
              text={`${profitAnalysis.profitMargin.toFixed(1)}%`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: '#10b981',
                textColor: '#0f172a',
                trailColor: '#f1f5f9',
                strokeLinecap: 'round'
              })}
            />
          </div>
          <p className="mt-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Profit Margin</p>
          <p className="text-xs font-bold text-stone-300">Gross Profit / Total Sales</p>
        </div>
        
        <div className="space-y-6 flex flex-col justify-center">
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Gross Revenue</p>
            <p className="text-2xl font-black text-stone-900 tracking-tight">
              {formatCurrency(profitAnalysis.grossRevenue)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Cost</p>
            <p className="text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(profitAnalysis.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Gross Profit</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(profitAnalysis.grossProfit)}
            </p>
          </div>
        </div>
        
        <div className="space-y-6 flex flex-col justify-center">
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="text-2xl font-black text-amber-600 tracking-tight">
              {formatCurrency(profitAnalysis.expenses.reduce((sum, e) => sum + e.amount, 0))}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Net Profit</p>
            <p className="text-3xl font-black text-indigo-600 tracking-tight">
              {formatCurrency(profitAnalysis.netProfit)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-stone-100">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Expense Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profitAnalysis.expenses.map((expense, index) => (
            <div key={index} className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{expense.category}</p>
              <p className="text-lg font-black text-stone-900 tracking-tight">
                {formatCurrency(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
