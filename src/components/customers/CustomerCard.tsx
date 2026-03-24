import React from 'react';
import { type Customer } from '../../types/customer';
import { useCustomer } from '../../hooks/useCustomer';
import { Phone, MapPin, Star } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  onPayClick: () => void;
  onSellClick: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onClick,
  onPayClick,
  onSellClick
}) => {
  const { formatBalance, getBalanceStatus } = useCustomer();
  const balanceStatus = getBalanceStatus(customer.currentBalance, customer.creditLimit);
  
  const statusColors = {
    good: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800'
  };

  const balanceColor = {
    good: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-stone-200 active:scale-[0.98]"
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-lg leading-tight">
                {customer.firstName} {customer.lastName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Phone size={14} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-500">{customer.phone}</span>
              </div>
            </div>
          </div>
          
          {customer.totalPurchases > 5000 && (
            <div className="bg-amber-400 text-amber-950 px-2 py-1 rounded-lg text-[10px] font-black flex items-center space-x-1 uppercase tracking-wider">
              <Star size={10} fill="currentColor" />
              <span>SUKI</span>
            </div>
          )}
        </div>

        {customer.address && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-stone-400">
            <MapPin size={14} />
            <span className="truncate">{customer.address}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between p-3 bg-stone-50 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Balance</p>
            <p className={`text-xl font-black ${balanceColor[balanceStatus]}`}>
              {formatBalance(customer.currentBalance)}
            </p>
          </div>
          
          {customer.currentBalance > 0 && (
            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusColors[balanceStatus]}`}>
              {balanceStatus === 'danger' ? 'Overdue' : balanceStatus === 'warning' ? 'Near Limit' : 'Has Utang'}
            </div>
          )}
        </div>

        <div className="mt-5 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSellClick();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            🛒 Benta
          </button>
          {customer.currentBalance > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPayClick();
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-100 active:scale-95"
            >
              💰 Bayad
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
