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
    this.version(2).stores({
      products: '++id, name, barcode, *barcodes, category',
      categories: '++id, name',
      customers: '++id, firstName, lastName, phone',
      transactions: '++id, customerId, timestamp, synced',
      transactionItems: '++id, transactionId, productId',
      stockMovements: '++id, productId, timestamp'
    });
  }
}

export const db = new SariSariDB();

// Seed data helper
export async function seedDatabase() {
  const productCount = await db.products.count();
  if (productCount > 0) return;

  const categories = [
    { name: 'Canned Goods', nameTagalog: 'De-lata', icon: '🥫', color: '#CE1126', isActive: true },
    { name: 'Noodles', nameTagalog: 'Pansit', icon: '🍜', color: '#FCD116', isActive: true },
    { name: 'Snacks', nameTagalog: 'Biskwit', icon: '🍪', color: '#0038A8', isActive: true },
    { name: 'Drinks', nameTagalog: 'Inumin', icon: '🥤', color: '#00A86B', isActive: true },
    { name: 'Personal Care', nameTagalog: 'Pansarili', icon: '🧼', color: '#4AA3DF', isActive: true },
    { name: 'Condiments', nameTagalog: 'Sawsawan', icon: '🧂', color: '#F15A24', isActive: true },
  ];

  await db.categories.bulkAdd(categories);

  const products: Product[] = [
    { name: 'Lucky Me Pancit Canton Extra Hot', category: 'Noodles', price: 15, cost: 12, stock: 50, minStock: 10, barcodes: ['4800016601234'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Lucky Me Pancit Canton Kalamansi', category: 'Noodles', price: 15, cost: 12, stock: 50, minStock: 10, barcodes: ['4800016601241'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Century Tuna Flakes in Oil 155g', category: 'Canned Goods', price: 38, cost: 32, stock: 24, minStock: 5, barcodes: ['4800016601258'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Argentina Corned Beef 150g', category: 'Canned Goods', price: 42, cost: 36, stock: 20, minStock: 5, barcodes: ['4800016601265'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Coca-Cola 290ml Sakto', category: 'Drinks', price: 15, cost: 12, stock: 48, minStock: 12, barcodes: ['4800016601272'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Skyflakes Crackers 10s', category: 'Snacks', price: 60, cost: 52, stock: 15, minStock: 3, barcodes: ['4800016601289'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Safeguard White 60g', category: 'Personal Care', price: 25, cost: 21, stock: 30, minStock: 5, barcodes: ['4800016601296'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Datu Puti Soy Sauce 200ml', category: 'Condiments', price: 18, cost: 15, stock: 25, minStock: 5, barcodes: ['4800016601302'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Datu Puti Vinegar 200ml', category: 'Condiments', price: 16, cost: 13, stock: 25, minStock: 5, barcodes: ['4800016601319'], createdAt: new Date(), updatedAt: new Date() },
    { name: 'Piattos Cheese 40g', category: 'Snacks', price: 18, cost: 15, stock: 40, minStock: 10, barcodes: ['4800016601326'], createdAt: new Date(), updatedAt: new Date() },
  ];

  await db.products.bulkAdd(products);
}
