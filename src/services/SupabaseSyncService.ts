// src/services/SupabaseSyncService.ts

import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../database/db';
import { toast } from 'react-hot-toast';

export interface SyncResult {
  success: boolean;
  productsSynced: number;
  transactionsSynced: number;
  customersSynced: number;
  errors: string[];
  timestamp: Date;
}

export class SupabaseSyncService {
  private isSyncing: boolean = false;
  
  // Check if Supabase is configured
  isConfigured(): boolean {
    return isSupabaseConfigured();
  }
  
  // Sync local database to Supabase
  async syncToCloud(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        productsSynced: 0,
        transactionsSynced: 0,
        customersSynced: 0,
        errors: ['Supabase not configured'],
        timestamp: new Date()
      };
    }
    
    if (this.isSyncing) {
      return {
        success: false,
        productsSynced: 0,
        transactionsSynced: 0,
        customersSynced: 0,
        errors: ['Sync already in progress'],
        timestamp: new Date()
      };
    }
    
    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      productsSynced: 0,
      transactionsSynced: 0,
      customersSynced: 0,
      errors: [],
      timestamp: new Date()
    };
    
    try {
      const supabase = getSupabase();
      
      // Sync Products
      const products = await db.products.toArray();
      // Note: We'll need to add 'synced' field to Product interface in db.ts
      const unsyncedProducts = products.filter(p => !(p as any).synced);
      
      for (const product of unsyncedProducts) {
        const { error } = await supabase
          .from('products')
          .upsert({
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            barcodes: product.barcodes,
            category: product.category,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            min_stock: product.minStock,
            image: product.image,
            created_at: product.createdAt,
            updated_at: product.updatedAt
          });
        
        if (!error) {
          await db.products.update(product.id!, { synced: true } as any);
          result.productsSynced++;
        } else {
          result.errors.push(`Product ${product.name}: ${error.message}`);
        }
      }
      
      // Sync Customers
      const customers = await db.customers.toArray();
      const unsyncedCustomers = customers.filter(c => !(c as any).synced);
      
      for (const customer of unsyncedCustomers) {
        const { error } = await supabase
          .from('customers')
          .upsert({
            id: customer.id,
            first_name: customer.firstName,
            last_name: customer.lastName,
            phone: customer.phone,
            address: customer.address,
            credit_limit: customer.creditLimit,
            current_balance: customer.currentBalance,
            created_at: customer.createdAt
          });
        
        if (!error) {
          await db.customers.update(customer.id!, { synced: true } as any);
          result.customersSynced++;
        } else {
          result.errors.push(`Customer ${customer.firstName}: ${error.message}`);
        }
      }

      // Sync Transactions
      const transactions = await db.transactions.where('synced').equals(0).toArray();
      
      for (const transaction of transactions) {
        const { error } = await supabase
          .from('transactions')
          .upsert({
            id: transaction.id,
            customer_id: transaction.customerId,
            total_amount: transaction.totalAmount,
            discount: transaction.discount,
            final_amount: transaction.finalAmount,
            payment_method: transaction.paymentMethod,
            payment_status: transaction.paymentStatus,
            amount_paid: transaction.amountPaid,
            change: transaction.change,
            timestamp: transaction.timestamp
          });
        
        if (!error) {
          await db.transactions.update(transaction.id!, { synced: true });
          result.transactionsSynced++;
        } else {
          result.errors.push(`Transaction ${transaction.id}: ${error.message}`);
        }
      }
      
      await this.updateLastSyncTime();
      
      if (result.errors.length === 0) {
        if (result.productsSynced > 0 || result.transactionsSynced > 0 || result.customersSynced > 0) {
          toast.success(`Synced ${result.productsSynced} products, ${result.transactionsSynced} transactions, ${result.customersSynced} customers`);
        }
      } else {
        toast.error(`Sync completed with ${result.errors.length} errors`);
      }
      
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      toast.error('Sync failed: ' + error.message);
    } finally {
      this.isSyncing = false;
    }
    
    return result;
  }
  
  // Pull updates from cloud
  async pullFromCloud(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        productsSynced: 0,
        transactionsSynced: 0,
        customersSynced: 0,
        errors: ['Supabase not configured'],
        timestamp: new Date()
      };
    }
    
    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      productsSynced: 0,
      transactionsSynced: 0,
      customersSynced: 0,
      errors: [],
      timestamp: new Date()
    };
    
    try {
      const supabase = getSupabase();
      const lastSync = await this.getLastSyncTime();
      const lastSyncStr = lastSync?.toISOString() || '2000-01-01';
      
      // Pull products updated after last sync
      const { data: cloudProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .gt('updated_at', lastSyncStr);
      
      if (!productsError && cloudProducts) {
        for (const cloudProduct of cloudProducts) {
          const existing = await db.products.get(cloudProduct.id);
          if (!existing || new Date(cloudProduct.updated_at) > existing.updatedAt) {
            await db.products.put({
              id: cloudProduct.id,
              name: cloudProduct.name,
              barcode: cloudProduct.barcode,
              barcodes: cloudProduct.barcodes,
              category: cloudProduct.category,
              price: cloudProduct.price,
              cost: cloudProduct.cost,
              stock: cloudProduct.stock,
              minStock: cloudProduct.min_stock,
              image: cloudProduct.image,
              synced: true,
              createdAt: new Date(cloudProduct.created_at),
              updatedAt: new Date(cloudProduct.updated_at)
            } as any);
            result.productsSynced++;
          }
        }
      }

      // Pull customers updated after last sync
      const { data: cloudCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .gt('updated_at', lastSyncStr);

      if (!customersError && cloudCustomers) {
        for (const cloudCustomer of cloudCustomers) {
          const existing = await db.customers.get(cloudCustomer.id);
          if (!existing) {
            await db.customers.put({
              id: cloudCustomer.id,
              firstName: cloudCustomer.first_name,
              lastName: cloudCustomer.last_name,
              phone: cloudCustomer.phone,
              address: cloudCustomer.address,
              creditLimit: cloudCustomer.credit_limit,
              currentBalance: cloudCustomer.current_balance,
              createdAt: new Date(cloudCustomer.created_at),
              synced: true
            } as any);
            result.customersSynced++;
          }
        }
      }

      // Pull transactions updated after last sync
      const { data: cloudTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gt('timestamp', lastSyncStr);

      if (!transactionsError && cloudTransactions) {
        for (const cloudTransaction of cloudTransactions) {
          const existing = await db.transactions.get(cloudTransaction.id);
          if (!existing) {
            await db.transactions.put({
              id: cloudTransaction.id,
              customerId: cloudTransaction.customer_id,
              totalAmount: cloudTransaction.total_amount,
              discount: cloudTransaction.discount,
              finalAmount: cloudTransaction.final_amount,
              paymentMethod: cloudTransaction.payment_method,
              paymentStatus: cloudTransaction.payment_status,
              amountPaid: cloudTransaction.amount_paid,
              change: cloudTransaction.change,
              timestamp: new Date(cloudTransaction.timestamp),
              synced: true
            });
            result.transactionsSynced++;
          }
        }
      }
      
      await this.updateLastSyncTime();
      
      if (result.productsSynced > 0 || result.transactionsSynced > 0 || result.customersSynced > 0) {
        toast.success(`Pulled ${result.productsSynced} products, ${result.transactionsSynced} transactions, ${result.customersSynced} customers from cloud`);
      }
      
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      toast.error('Pull failed: ' + error.message);
    } finally {
      this.isSyncing = false;
    }
    
    return result;
  }
  
  // Get last sync time
  private async getLastSyncTime(): Promise<Date | null> {
    const stored = localStorage.getItem('store-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.state.settings.backup.lastSync ? new Date(settings.state.settings.backup.lastSync) : null;
    }
    return null;
  }
  
  // Update last sync time
  private async updateLastSyncTime(): Promise<void> {
    const stored = localStorage.getItem('store-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state.settings.backup.lastSync = new Date();
      localStorage.setItem('store-settings', JSON.stringify(parsed));
    }
  }
}

export const supabaseSync = new SupabaseSyncService();
