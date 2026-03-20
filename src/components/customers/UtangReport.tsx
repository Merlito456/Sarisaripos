import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';

interface UtangReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UtangReport: React.FC<UtangReportProps> = ({ isOpen, onClose }) => {
  const { customers, formatBalance } = useCustomer();
  const customersWithUtang = customers.filter(c => c.currentBalance > 0);
  const totalUtang = customersWithUtang.reduce((sum, c) => sum + c.currentBalance, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">Utang Report</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-900">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Receivables</p>
              <p className="text-3xl font-black text-rose-600">{formatBalance(totalUtang)}</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Debtors</p>
              <p className="text-3xl font-black text-indigo-900">{customersWithUtang.length}</p>
            </div>
          </div>

          <div className="border border-stone-100 rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {customersWithUtang.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-stone-900">{customer.firstName} {customer.lastName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-500">{customer.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-rose-600">{formatBalance(customer.currentBalance)}</p>
                    </td>
                  </tr>
                ))}
                {customersWithUtang.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-stone-400 font-medium">
                      No outstanding balances. Good job! 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex space-x-4">
          <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center space-x-2">
            <Download size={20} />
            <span>Export PDF</span>
          </button>
          <button className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-stone-100 active:scale-95 flex items-center justify-center space-x-2">
            <Printer size={20} />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
