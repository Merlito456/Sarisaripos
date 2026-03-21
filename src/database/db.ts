import Dexie, { type Table } from 'dexie';

import { VisualFeatures } from '../types/detection';

export interface Product {
  id?: string;
  userId?: string; // Added for multi-user support
  name: string;
  barcode?: string;
  barcodes?: string[]; // Multiple barcodes for same product
  category: string;
  price: number;
  cost: number;
  minPrice?: number;
  maxPrice?: number;
  stock: number;
  minStock: number;
  unitId?: string; // Reference to productUnits
  masterProductId?: string; // Reference to masterProducts
  image?: string;
  visualFeatures?: VisualFeatures;
  timesDetected?: number;
  lastDetectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  synced?: boolean;
}

export interface ProductUnit {
  id: string;
  masterProductId: string;
  unitName: string; // e.g., 'stick', 'pack', 'piece', 'sachet'
  unitType: 'retail' | 'wholesale';
  quantity: number; // how many base units per this selling unit
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  isDefault: boolean;
  isActive: boolean;
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
  updatedAt?: Date;
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
  items?: TransactionItem[];
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

export interface MasterProduct {
  id: string;
  gtin: string;
  brand?: string;
  product_name: string;
  variant?: string;
  size?: string;
  category_id?: string;
  subcategory?: string;
  description?: string;
  suggested_retail_price?: number;
  suggested_cost_price?: number;
  min_price?: number;
  max_price?: number;
  manufacturer?: string;
  distributor?: string;
  country_of_origin?: string;
  is_imported?: boolean;
  image_url?: string;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SariSariDB extends Dexie {
  products!: Table<Product>;
  categories!: Table<Category>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  transactionItems!: Table<TransactionItem>;
  stockMovements!: Table<StockMovement>;
  masterProducts!: Table<MasterProduct>;
  productUnits!: Table<ProductUnit>;

  constructor() {
    super('SariSariDB');
    this.version(5).stores({
      products: '++id, name, barcode, *barcodes, category, synced, unitId, masterProductId',
      categories: '++id, name',
      customers: '++id, firstName, lastName, phone, synced',
      transactions: '++id, customerId, timestamp, synced',
      transactionItems: '++id, transactionId, productId',
      stockMovements: '++id, productId, timestamp',
      masterProducts: 'id, gtin, product_name, brand',
      productUnits: 'id, masterProductId, barcode, isDefault, isActive'
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
