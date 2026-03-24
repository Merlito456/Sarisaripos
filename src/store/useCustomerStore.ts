import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Customer, type Payment, type CustomerSummary } from '../types/customer';
import { customerDB } from '../database/customer.db';

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance' | 'totalPurchases' | 'lastPurchaseDate' | 'isActive'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  recordPayment: (payment: Omit<Payment, 'id' | 'timestamp'>) => Promise<void>;
  getCustomerSummary: () => Promise<CustomerSummary>;
  getCustomersWithUtang: () => Customer[];
  searchCustomers: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomer: null,
      isLoading: false,
      error: null,

      loadCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
          // Fetch only active customers directly from DB
          const activeCustomers = await customerDB.customers
            .where('isActive')
            .equals(1) // Assuming 1 for true if it's stored as number, or true if boolean
            .toArray();
          
          // If the above query fails to find anything because of type mismatch (boolean vs number)
          // we can fallback to filtering, but let's try to be efficient.
          // In Dexie, booleans are often stored as 1/0 for indexing.
          
          if (activeCustomers.length === 0) {
            // Fallback check if it's stored as boolean true
            const booleanActive = await customerDB.customers
              .where('isActive')
              .equals(true as any)
              .toArray();
            
            if (booleanActive.length > 0) {
              set({ customers: booleanActive, isLoading: false });
              return;
            }
          }

          set({ customers: activeCustomers, isLoading: false });
        } catch (error) {
          console.error('Failed to load customers:', error);
          set({ error: 'Failed to load customers', isLoading: false });
        }
      },

      addCustomer: async (customerData) => {
        set({ isLoading: true, error: null });
        try {
          const id = `CUST${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const newCustomer: Customer = {
            ...customerData,
            id,
            currentBalance: 0,
            totalPurchases: 0,
            lastPurchaseDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };
          
          await customerDB.customers.add(newCustomer);
          set(state => ({ 
            customers: [...state.customers, newCustomer],
            isLoading: false 
          }));
        } catch (error) {
          set({ error: 'Failed to add customer', isLoading: false });
        }
      },

      updateCustomer: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await customerDB.customers.update(id, {
            ...updates,
            updatedAt: new Date()
          });
          
          set(state => ({
            customers: state.customers.map(c => 
              c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to update customer', isLoading: false });
        }
      },

      deleteCustomer: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await customerDB.customers.update(id, { isActive: false });
          set(state => ({
            customers: state.customers.filter(c => c.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to delete customer', isLoading: false });
        }
      },

      selectCustomer: (customer) => {
        set({ selectedCustomer: customer });
      },

      recordPayment: async (paymentData) => {
        set({ isLoading: true, error: null });
        try {
          await customerDB.recordPayment(paymentData);
          await get().loadCustomers(); // Refresh customers list
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to record payment', isLoading: false });
        }
      },

      getCustomerSummary: async () => {
        const customers = get().customers;
        const customersWithBalance = customers.filter(c => c.currentBalance > 0);
        
        const summary: CustomerSummary = {
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => c.isActive).length,
          totalReceivables: customers.reduce((sum, c) => sum + c.currentBalance, 0),
          averageCreditLimit: customers.reduce((sum, c) => sum + c.creditLimit, 0) / (customers.length || 1),
          topSpenders: [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5),
          overdueCustomers: customersWithBalance.filter(c => {
            // Consider overdue if balance > 0 and last purchase > 30 days ago
            if (!c.lastPurchaseDate) return false;
            const daysSinceLastPurchase = (Date.now() - new Date(c.lastPurchaseDate).getTime()) / (1000 * 3600 * 24);
            return daysSinceLastPurchase > 30;
          }),
          customersNearLimit: customers.filter(c => c.currentBalance >= c.creditLimit * 0.8 && c.creditLimit > 0)
        };
        
        return summary;
      },

      getCustomersWithUtang: () => {
        return get().customers.filter(c => c.currentBalance > 0);
      },

      searchCustomers: (query) => {
        if (!query.trim()) return get().customers;
        const lowerQuery = query.toLowerCase();
        return get().customers.filter(c => 
          c.firstName.toLowerCase().includes(lowerQuery) ||
          c.lastName.toLowerCase().includes(lowerQuery) ||
          c.phone.includes(lowerQuery)
        );
      }
    }),
    {
      name: 'customer-storage',
      partialize: (state) => ({ customers: state.customers })
    }
  )
);
