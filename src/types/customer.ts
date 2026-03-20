export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  email?: string;
  creditLimit: number; // Maximum allowed utang
  currentBalance: number; // Current outstanding balance
  totalPurchases: number; // Lifetime purchases
  lastPurchaseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  notes?: string;
  tags?: string[]; // e.g., ['suki', 'senior', 'pwd']
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: 'cash' | 'gcash' | 'maya' | 'bank_transfer';
  referenceNumber?: string;
  notes?: string;
  timestamp: Date;
  appliedToTransactions: string[]; // Transaction IDs this payment covers
}

export interface CustomerTransaction {
  transactionId: string;
  date: Date;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'paid' | 'unpaid' | 'partial';
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface CustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  totalReceivables: number;
  averageCreditLimit: number;
  topSpenders: Customer[];
  overdueCustomers: Customer[];
  customersNearLimit: Customer[];
}
