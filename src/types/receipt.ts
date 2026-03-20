// src/types/receipt.ts

export interface ReceiptData {
  id: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  tin?: string; // Tax Identification Number
  transaction: {
    id: string;
    date: Date;
    customerName?: string;
    cashierName?: string;
  };
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'gcash' | 'maya' | 'credit' | 'bank_transfer';
  amountPaid: number;
  change: number;
  message?: string; // Thank you message
  paperWidth?: 58 | 80;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PrinterSettings {
  type: 'thermal' | 'standard' | 'digital';
  paperWidth: 58 | 80; // mm
  showLogo: boolean;
  showQR: boolean;
  copies: number;
}

export type ReceiptFormat = 'thermal' | 'digital' | 'pdf' | 'image';
