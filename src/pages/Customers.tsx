import React, { useState, useEffect } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useCustomer } from '../hooks/useCustomer';
import { CustomerCard } from '../components/customers/CustomerCard';
import { CustomerForm } from '../components/customers/CustomerForm';
import { PaymentModal } from '../components/customers/PaymentModal';
import { UtangReport } from '../components/customers/UtangReport';
import { CustomerStats } from '../components/customers/CustomerStats';
import { type Customer, type CustomerSummary } from '../types/customer';

export const Customers: React.FC = () => {
  const { 
    customers, 
    filteredCustomers, 
    searchQuery, 
    setSearchQuery,
    selectCustomer,
    getCustomerSummary,
  } = useCustomer();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    getCustomerSummary().then(setSummary);
  }, [customers]);

  const handlePayClick = (customer: Customer) => {
    setSelectedCustomerForPayment(customer);
    setIsPaymentOpen(true);
  };

  const handleSellClick = (customer: Customer) => {
    selectCustomer(customer);
    // Navigate to POS with customer selected
    // For now, just show a toast or log
    console.log('Selling to:', customer.firstName);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 bg-stone-50 min-h-full">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight uppercase leading-none">Customers</h1>
          <p className="text-stone-500 font-medium text-sm lg:text-base">Manage your suki and track utang</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-100 font-black uppercase tracking-widest active:scale-95"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </header>

      {/* Stats Grid */}
      <CustomerStats summary={summary} />

      {/* Actions Bar */}
      <div className="bg-white rounded-3xl shadow-sm p-4 lg:p-6 border border-stone-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-medium"
            />
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-stone-100 active:scale-95"
          >
            Utang Report
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={() => selectCustomer(customer)}
            onPayClick={() => handlePayClick(customer)}
            onSellClick={() => handleSellClick(customer)}
          />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-stone-300" />
          </div>
          <p className="text-stone-500 font-bold text-lg">No customers found</p>
          <p className="text-stone-400 text-sm mb-8">Start by adding your first suki!</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="text-indigo-600 font-black uppercase tracking-widest hover:text-indigo-700 underline underline-offset-8"
          >
            Add your first customer
          </button>
        </div>
      )}

      {/* Modals */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {selectedCustomerForPayment && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedCustomerForPayment(null);
          }}
          customer={selectedCustomerForPayment}
        />
      )}

      <UtangReport
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
      
      {/* Bottom Spacer for Mobile Nav */}
      <div className="h-24 lg:hidden" />
    </div>
  );
};
