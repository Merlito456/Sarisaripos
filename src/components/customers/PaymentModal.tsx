import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Landmark } from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';
import { type Customer } from '../../types/customer';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const { recordPaymentWithToast, formatBalance } = useCustomer();
  const [amount, setAmount] = useState(customer.currentBalance);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'maya' | 'bank_transfer'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount > customer.currentBalance) {
      alert('Payment amount cannot exceed current balance');
      return;
    }

    await recordPaymentWithToast({
      customerId: customer.id,
      amount,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      notes: `Payment for ${customer.firstName} ${customer.lastName}`,
      appliedToTransactions: []
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        <div className="border-b border-stone-100 p-6 flex justify-between items-center bg-stone-50/50">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">Record Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-900">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Customer</p>
              <p className="font-black text-indigo-900 text-lg">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Current Balance</p>
              <p className="text-3xl font-black text-rose-600">
                {formatBalance(customer.currentBalance)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Payment Amount *
            </label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-black text-indigo-600 text-xl"
              min={1}
              max={customer.currentBalance}
              step={0.01}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <PaymentMethodButton 
                active={paymentMethod === 'cash'} 
                onClick={() => setPaymentMethod('cash')}
                icon={<CreditCard size={18} />}
                label="Cash"
                color="emerald"
              />
              <PaymentMethodButton 
                active={paymentMethod === 'gcash'} 
                onClick={() => setPaymentMethod('gcash')}
                icon={<Smartphone size={18} />}
                label="GCash"
                color="blue"
              />
              <PaymentMethodButton 
                active={paymentMethod === 'maya'} 
                onClick={() => setPaymentMethod('maya')}
                icon={<Smartphone size={18} />}
                label="Maya"
                color="purple"
              />
              <PaymentMethodButton 
                active={paymentMethod === 'bank_transfer'} 
                onClick={() => setPaymentMethod('bank_transfer')}
                icon={<Landmark size={18} />}
                label="Bank"
                color="amber"
              />
            </div>
          </div>

          {(paymentMethod !== 'cash') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium"
                placeholder="Transaction ID / Ref #"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Record Payment</span>
            <span>💰</span>
          </button>
        </form>
      </div>
    </div>
  );
};

function PaymentMethodButton({ active, onClick, icon, label, color }: any) {
  const colors: any = {
    emerald: active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 hover:border-emerald-200',
    blue: active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-stone-200 hover:border-blue-200',
    purple: active ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-stone-200 hover:border-purple-200',
    amber: active ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 hover:border-amber-200',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center space-y-1 ${colors[color]}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
