import Dexie, { type Table } from 'dexie';
import { type Customer, type Payment } from '../types/customer';

export class CustomerDatabase extends Dexie {
  customers!: Table<Customer, string>;
  payments!: Table<Payment, string>;

  constructor() {
    super('SariSariPOS_Customers');
    
    this.version(1).stores({
      customers: 'id, firstName, lastName, phone, currentBalance, creditLimit, isActive, createdAt, lastPurchaseDate',
      payments: 'id, customerId, amount, timestamp, paymentMethod'
    });
  }

  // Get all active customers
  async getActiveCustomers(): Promise<Customer[]> {
    return await this.customers.where('isActive').equals(1).toArray(); // Dexie uses 1 for true in some versions, but let's use true if it's boolean
  }

  // Search customers by name or phone
  async searchCustomers(query: string): Promise<Customer[]> {
    const lowerQuery = query.toLowerCase();
    return await this.customers
      .filter(customer => 
        customer.firstName.toLowerCase().includes(lowerQuery) ||
        customer.lastName.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(lowerQuery)
      )
      .toArray();
  }

  // Get customers with utang
  async getCustomersWithBalance(): Promise<Customer[]> {
    return await this.customers
      .where('currentBalance')
      .above(0)
      .and(customer => customer.isActive === true)
      .toArray();
  }

  // Update customer balance
  async updateBalance(customerId: string, amount: number): Promise<void> {
    const customer = await this.customers.get(customerId);
    if (customer) {
      customer.currentBalance += amount;
      customer.updatedAt = new Date();
      await this.customers.update(customerId, {
        currentBalance: customer.currentBalance,
        updatedAt: customer.updatedAt
      });
    }
  }

  // Record payment
  async recordPayment(payment: Omit<Payment, 'id' | 'timestamp'>): Promise<string> {
    const id = `PAY${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newPayment: Payment = { ...payment, id, timestamp: new Date() };
    
    await this.payments.add(newPayment);
    await this.updateBalance(payment.customerId, -payment.amount);
    
    return id;
  }

  // Get customer payment history
  async getPaymentHistory(customerId: string): Promise<Payment[]> {
    return await this.payments
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('timestamp');
  }
}

export const customerDB = new CustomerDatabase();
