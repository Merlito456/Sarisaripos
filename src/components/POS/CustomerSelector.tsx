import React, { useState, useEffect } from 'react';
import { User, Search, X, Check, UserPlus } from 'lucide-react';
import { db, type Customer } from '../../database/db';
import { usePOSStore } from '../../store/usePOSStore';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export const CustomerSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedCustomer, setCustomer } = usePOSStore();

  useEffect(() => {
    if (isOpen) {
      db.customers.toArray().then(setCustomers);
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
          selectedCustomer 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
            : 'bg-stone-50 border-stone-100 text-stone-500 hover:border-stone-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${selectedCustomer ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
            <User size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Customer</p>
            <p className="font-bold truncate max-w-[150px]">
              {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Select Customer'}
            </p>
          </div>
        </div>
        {selectedCustomer && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCustomer(null);
            }}
            className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-400"
          >
            <X size={16} />
          </button>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Select Customer</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by name or phone..."
                    className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setCustomer(customer);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                          selectedCustomer?.id === customer.id ? 'bg-white/20' : 'bg-stone-200 text-stone-500'
                        }`}>
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{customer.firstName} {customer.lastName}</p>
                          <p className={`text-xs ${selectedCustomer?.id === customer.id ? 'text-white/60' : 'text-stone-400'}`}>
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                      {selectedCustomer?.id === customer.id && <Check size={20} />}
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-stone-400">
                      <p className="font-bold">No customers found</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100">
                <button 
                  onClick={() => {
                    // In a real app, this would open the Add Customer modal
                    toast.error('Please add customers in the Customers page');
                  }}
                  className="w-full py-4 bg-white border-2 border-dashed border-stone-200 text-stone-500 rounded-2xl font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2"
                >
                  <UserPlus size={20} />
                  <span>Add New Customer</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
