import Dexie, { type Table } from 'dexie';

import { VisualFeatures } from '../types/detection';

export interface Product {
  id?: string;
  name: string;
  barcode?: string;
  barcodes?: string[]; // Multiple barcodes for same product
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image?: string;
  visualFeatures?: VisualFeatures;
  timesDetected?: number;
  lastDetectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  synced?: boolean;
}

export interface Category {
  id?: string;
  name: string;
  nameTagalog?: string;
  icon: string;
  color?: string;
  isActive?: boolean;
}

export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  createdAt: Date;
  synced?: boolean;
}

export interface Transaction {
  id?: string;
  customerId?: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'gcash' | 'maya' | 'credit' | 'bank_transfer';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  amountPaid: number;
  change: number;
  timestamp: Date;
  synced: boolean;
}

export interface TransactionItem {
  id?: string;
  transactionId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface StockMovement {
  id?: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  reference: string;
  notes: string;
  timestamp: Date;
}

export class SariSariDB extends Dexie {
  products!: Table<Product>;
  categories!: Table<Category>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  transactionItems!: Table<TransactionItem>;
  stockMovements!: Table<StockMovement>;

  constructor() {
    super('SariSariDB');
    this.version(3).stores({
      products: '++id, name, barcode, *barcodes, category, synced',
      categories: '++id, name',
      customers: '++id, firstName, lastName, phone, synced',
      transactions: '++id, customerId, timestamp, synced',
      transactionItems: '++id, transactionId, productId',
      stockMovements: '++id, productId, timestamp'
    });
  }
}

export const db = new SariSariDB();

// Seed data helper
export async function seedDatabase() {
  // One-time cleanup to remove existing seed products for current users
  const hasCleaned = localStorage.getItem('sarisari_db_cleaned_v1');
  if (!hasCleaned) {
    await db.products.clear();
    await db.customers.clear();
    await db.transactions.clear();
    await db.transactionItems.clear();
    await db.stockMovements.clear();
    localStorage.setItem('sarisari_db_cleaned_v1', 'true');
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const categories = [
      { name: 'Canned Goods', nameTagalog: 'De-lata', icon: '🥫', color: '#CE1126', isActive: true },
      { name: 'Noodles', nameTagalog: 'Pansit', icon: '🍜', color: '#FCD116', isActive: true },
      { name: 'Snacks', nameTagalog: 'Biskwit', icon: '🍪', color: '#0038A8', isActive: true },
      { name: 'Drinks', nameTagalog: 'Inumin', icon: '🥤', color: '#00A86B', isActive: true },
      { name: 'Personal Care', nameTagalog: 'Pansarili', icon: '🧼', color: '#4AA3DF', isActive: true },
      { name: 'Condiments', nameTagalog: 'Sawsawan', icon: '🧂', color: '#F15A24', isActive: true },
    ];
    await db.categories.bulkAdd(categories);
  }
}
