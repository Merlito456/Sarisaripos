import { useEffect, useState } from 'react';
import { useCustomerStore } from '../store/useCustomerStore';
import { type Customer } from '../types/customer';
import { toast } from 'react-hot-toast';

export const useCustomer = () => {
  const store = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    store.loadCustomers();
  }, []);

  const filteredCustomers = store.searchCustomers(searchQuery);
  
  const addCustomerWithToast = async (customerData: any) => {
    try {
      await store.addCustomer(customerData);
      toast.success('Customer added successfully! Salamat po! 🎉');
      return true;
    } catch (error) {
      toast.error('Failed to add customer. Please try again.');
      return false;
    }
  };

  const recordPaymentWithToast = async (paymentData: any) => {
    try {
      await store.recordPayment(paymentData);
      toast.success('Payment recorded! Salamat sa bayad! 💰');
      return true;
    } catch (error) {
      toast.error('Failed to record payment.');
      return false;
    }
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(balance);
  };

  const getBalanceStatus = (balance: number, creditLimit: number): 'good' | 'warning' | 'danger' => {
    if (balance === 0) return 'good';
    if (balance >= creditLimit) return 'danger';
    if (balance >= creditLimit * 0.7) return 'warning';
    return 'good';
  };

  return {
    ...store,
    searchQuery,
    setSearchQuery,
    filteredCustomers,
    addCustomerWithToast,
    recordPaymentWithToast,
    formatBalance,
    getBalanceStatus
  };
};
