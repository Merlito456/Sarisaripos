import { db, type Product, type Customer, type Transaction } from '../database/db';
import { getSupabase } from '../lib/supabase';
import { premiumService } from './PremiumService';

class DataService {
  private async isPremium(): Promise<boolean> {
    const status = await premiumService.getPremiumStatus();
    return status.isPremium;
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data.map(this.mapSupabaseProduct);
    }
    return db.products.toArray();
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        name: product.name,
        barcode: product.barcode,
        barcodes: product.barcodes,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.minStock,
        image: product.image
      }).select().single();
      
      if (error) throw error;
      return data.id;
    }
    const id = await db.products.add(product as Product);
    return id.toString();
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { error } = await supabase.from('products').update({
        name: product.name,
        barcode: product.barcode,
        barcodes: product.barcodes,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.minStock,
        image: product.image
      }).eq('id', id);
      
      if (error) throw error;
      return;
    }
    await db.products.update(id, product);
  }

  async deleteProduct(id: string): Promise<void> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await db.products.delete(id);
  }

  // MASTER PRODUCTS
  async searchMasterProducts(query: string): Promise<any[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('master_products')
      .select('*')
      .or(`name.ilike.%${query}%,barcode.eq.${query}`)
      .limit(10);
    
    if (error) {
      console.warn('Failed to search master products:', error);
      return [];
    }
    return data;
  }

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data.map(this.mapSupabaseCustomer);
    }
    return db.customers.toArray();
  }

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.from('customers').insert({
        user_id: user.id,
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
        address: customer.address,
        credit_limit: customer.creditLimit,
        current_balance: customer.currentBalance
      }).select().single();

      if (error) throw error;
      return data.id;
    }
    const id = await db.customers.add(customer as Customer);
    return id.toString();
  }

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('transactions').select('*, items:transaction_items(*)');
      if (error) throw error;
      return data.map(this.mapSupabaseTransaction);
    }
    return db.transactions.toArray();
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    if (await this.isPremium()) {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        customer_id: transaction.customerId,
        total_amount: transaction.totalAmount,
        discount: transaction.discount,
        final_amount: transaction.finalAmount,
        payment_method: transaction.paymentMethod,
        payment_status: transaction.paymentStatus,
        amount_paid: transaction.amountPaid,
        change: transaction.change,
        timestamp: transaction.timestamp.toISOString()
      }).select().single();

      if (txError) throw txError;

      if (transaction.items && transaction.items.length > 0) {
        const items = transaction.items.map(item => ({
          transaction_id: txData.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity // Use unitPrice * quantity
        }));

        const { error: itemsError } = await supabase.from('transaction_items').insert(items);
        if (itemsError) throw itemsError;
      }

      return txData.id;
    }
    const id = await db.transactions.add(transaction as Transaction);
    return id.toString();
  }

  // BACKUP LOCAL TO CLOUD
  async backupToCloud(): Promise<void> {
    const status = await premiumService.getPremiumStatus();
    if (!status.isPremium) throw new Error('Premium plan required for cloud backup');

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Backup Products
    const localProducts = await db.products.toArray();
    if (localProducts.length > 0) {
      const productsToSync = localProducts.map(p => ({
        user_id: user.id,
        name: p.name,
        barcode: p.barcode,
        barcodes: p.barcodes,
        category: p.category,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        min_stock: p.minStock,
        image: p.image
      }));
      await supabase.from('products').upsert(productsToSync, { onConflict: 'name,user_id' });
    }

    // Backup Customers
    const localCustomers = await db.customers.toArray();
    if (localCustomers.length > 0) {
      const customersToSync = localCustomers.map(c => ({
        user_id: user.id,
        first_name: c.firstName,
        last_name: c.lastName,
        phone: c.phone,
        address: c.address,
        credit_limit: c.creditLimit,
        current_balance: c.currentBalance
      }));
      await supabase.from('customers').upsert(customersToSync, { onConflict: 'first_name,last_name,user_id' });
    }

    // Backup Transactions
    const localTransactions = await db.transactions.toArray();
    if (localTransactions.length > 0) {
      for (const tx of localTransactions) {
        const { data: txData, error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          customer_id: tx.customerId,
          total_amount: tx.totalAmount,
          discount: tx.discount,
          final_amount: tx.finalAmount,
          payment_method: tx.paymentMethod,
          payment_status: tx.paymentStatus,
          amount_paid: tx.amountPaid,
          change: tx.change,
          timestamp: tx.timestamp.toISOString()
        }).select().single();

        if (!txError && txData) {
          // Fetch items for this transaction
          const txItems = await db.transactionItems.where('transactionId').equals(tx.id!).toArray();
          if (txItems.length > 0) {
            const items = txItems.map(item => ({
              transaction_id: txData.id,
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.subtotal
            }));
            await supabase.from('transaction_items').insert(items);
          }
        }
      }
    }
  }

  // MAPPERS
  private mapSupabaseProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      barcodes: p.barcodes,
      category: p.category,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
      minStock: p.min_stock,
      image: p.image,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at)
    };
  }

  private mapSupabaseCustomer(c: any): Customer {
    return {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      phone: c.phone,
      address: c.address,
      creditLimit: Number(c.credit_limit),
      currentBalance: Number(c.current_balance),
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at)
    };
  }

  private mapSupabaseTransaction(t: any): Transaction {
    return {
      id: t.id,
      customerId: t.customer_id,
      totalAmount: Number(t.total_amount),
      discount: Number(t.discount),
      finalAmount: Number(t.final_amount),
      paymentMethod: t.payment_method,
      paymentStatus: t.payment_status,
      amountPaid: Number(t.amount_paid),
      change: Number(t.change),
      timestamp: new Date(t.timestamp),
      synced: true,
      items: t.items.map((i: any) => ({
        id: i.id,
        transactionId: i.transaction_id,
        productId: i.product_id,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        subtotal: Number(i.total_price)
      }))
    };
  }
}

export const dataService = new DataService();
