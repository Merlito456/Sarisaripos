import { create } from 'zustand';
import { db, type Product, type Customer, type Transaction, type TransactionItem } from '../database/db';
import toast from 'react-hot-toast';

interface CartItem extends Product {
  quantity: number;
}

interface POSState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  discount: number;
  isProcessing: boolean;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomer: (customer: Customer | null) => void;
  applyDiscount: (amount: number) => void;
  clearCart: () => void;
  checkout: (paymentMethod: Transaction['paymentMethod'], amountPaid: number) => Promise<void>;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  discount: 0,
  isProcessing: false,

  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.id === product.id);
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
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  setCustomer: (customer) => set({ selectedCustomer: customer }),
  
  applyDiscount: (amount) => set({ discount: amount }),

  clearCart: () => set({ cart: [], selectedCustomer: null, discount: 0 }),

  checkout: async (paymentMethod, amountPaid) => {
    const { cart, selectedCustomer, discount, clearCart } = get();
    if (cart.length === 0) return;

    set({ isProcessing: true });

    try {
      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const finalAmount = totalAmount - discount;
      const change = amountPaid - finalAmount;

      const transaction: Transaction = {
        customerId: selectedCustomer?.id,
        totalAmount,
        discount,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
        amountPaid,
        change: Math.max(0, change),
        timestamp: new Date(),
        synced: false,
      };

      const transactionId = await db.transactions.add(transaction);

      const items: TransactionItem[] = cart.map((item) => ({
        transactionId: transactionId as string,
        productId: item.id!,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      }));

      await db.transactionItems.bulkAdd(items);

      // Update stock
      for (const item of cart) {
        await db.products.update(item.id!, {
          stock: item.stock - item.quantity,
          updatedAt: new Date(),
        });

        await db.stockMovements.add({
          productId: item.id!,
          type: 'out',
          quantity: item.quantity,
          reference: `Sale #${transactionId}`,
          notes: 'POS Sale',
          timestamp: new Date(),
        });
      }

      // Update customer balance if credit
      if (paymentMethod === 'credit' && selectedCustomer) {
        await db.customers.update(selectedCustomer.id!, {
          currentBalance: selectedCustomer.currentBalance + finalAmount,
        });
      }

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
