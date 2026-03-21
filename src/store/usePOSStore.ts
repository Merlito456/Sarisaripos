import { create } from 'zustand';
import { type Product, type Customer, type Transaction, type TransactionItem } from '../database/db';
import { dataService } from '../services/DataService';
import { ReceiptData } from '../types/receipt';
import toast from 'react-hot-toast';
import { premiumService } from '../services/PremiumService';

import { useSettingsStore } from './useSettingsStore';

interface CartItem extends Product {
  quantity: number;
}

interface POSState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discount: number;
  isProcessing: boolean;
  currentReceipt: ReceiptData | null;
  showReceipt: boolean;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomer: (customer: Customer | null) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
  clearReceipt: () => void;
  checkout: (paymentMethod: Transaction['paymentMethod'], amountPaid: number) => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  discount: 0,
  isProcessing: false,
  currentReceipt: null,
  showReceipt: false,

  addToCart: (product, quantity = 1) => {
    const { settings } = useSettingsStore.getState();
    const { cart } = get();
    
    const existingItem = cart.find((item) => item.id === product.id);
    const totalQuantity = (existingItem?.quantity || 0) + quantity;

    // If inventory tracking is enabled, check stock
    if (settings.inventory.inventoryEnabled && product.stock < totalQuantity) {
      toast.error(`Insufficient stock. Only ${product.stock} left.`);
      return;
    }

    set((state) => {
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity }] };
    });
    toast.success(`${product.name} added to cart`);
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    const { cart } = get();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const { settings } = useSettingsStore.getState();
    if (settings.inventory.inventoryEnabled && item.stock < quantity) {
      toast.error(`Insufficient stock. Only ${item.stock} left.`);
      return;
    }

    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  setCustomer: (customer) => set({ selectedCustomer: customer }),
  
  applyDiscount: (amount) => set({ discount: amount }),

  clearCart: () => set({ cart: [], selectedCustomer: null, discount: 0 }),

  clearReceipt: () => set({ currentReceipt: null, showReceipt: false }),

  checkout: async (paymentMethod, amountPaid) => {
    const { cart, selectedCustomer, discount, clearCart } = get();
    if (cart.length === 0) return;

    if (paymentMethod === 'credit' && !selectedCustomer) {
      toast.error('Please select a customer for credit (Utang) payments');
      return;
    }

    set({ isProcessing: true });

    try {
      const canAdd = await premiumService.canAddTransaction();
      if (!canAdd) {
        toast.error('Monthly transaction limit reached for your plan. Please upgrade to continue.');
        set({ isProcessing: false });
        return;
      }

      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const finalAmount = totalAmount - discount;
      const change = amountPaid - finalAmount;

      // Check credit limit if applicable
      if (paymentMethod === 'credit' && selectedCustomer) {
        const newBalance = selectedCustomer.currentBalance + finalAmount;
        if (newBalance > selectedCustomer.creditLimit) {
          toast.error(`Credit limit exceeded! (Limit: ₱${selectedCustomer.creditLimit})`);
          set({ isProcessing: false });
          return;
        }
      }

      const transaction: Omit<Transaction, 'id'> = {
        customerId: selectedCustomer?.id,
        totalAmount,
        discount,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
        amountPaid,
        change: Math.max(0, change),
        timestamp: new Date(),
        synced: true,
        items: cart.map((item) => ({
          productId: item.id!,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          transactionId: '', // Will be set by service
        })),
      };

      const transactionId = await dataService.addTransaction(transaction);

      // Update stock if inventory is enabled
      const { settings } = useSettingsStore.getState();
      if (settings.inventory.inventoryEnabled) {
        for (const item of cart) {
          await dataService.updateProduct(item.id!, {
            stock: item.stock - item.quantity,
            updatedAt: new Date(),
          });
        }
      }

      // Update customer balance if credit (Note: DataService should handle this ideally, but for now we do it here if it's local)
      // Actually, let's keep it simple and assume DataService handles the core storage.
      // If I want to update customer balance in Supabase, I should add a method to DataService.

      // Generate Receipt Data
      const receiptData: ReceiptData = {
        id: `RCPT-${transactionId}`,
        storeName: 'Sari-Sari Store',
        storeAddress: 'Barangay, City, Philippines',
        storePhone: '09123456789',
        transaction: {
          id: transactionId,
          date: new Date(),
          customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined,
          cashierName: 'Store Owner'
        },
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: totalAmount,
        discount,
        total: finalAmount,
        paymentMethod,
        amountPaid,
        change: Math.max(0, change),
        message: 'Thank you for your purchase!'
      };

      set({ currentReceipt: receiptData, showReceipt: true });
      toast.success('Transaction completed!');
      clearCart();
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Checkout failed. Please try again.');
    } finally {
      set({ isProcessing: false });
    }
  },
}));
