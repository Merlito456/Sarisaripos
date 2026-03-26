import { PremiumPlan, PlanType } from '../types/premium';

export const PREMIUM_PLANS: Record<PlanType, PremiumPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    features: {
      cloudSync: true,
      cloudRestore: false,
      barcodeScanning: false,
      maxProducts: 100,
      maxCustomers: 50,
      advancedReports: false,
      prioritySupport: false,
      backupRetention: 0
    },
    limits: {
      products: 100,
      customers: 50,
      transactionsPerDay: 50,
      stores: 1
    }
  },
  premium_lite: {
    id: 'premium_lite',
    name: 'Premium Lite',
    price: 149,
    priceYearly: 1490,
    features: {
      cloudSync: true,
      cloudRestore: true,
      barcodeScanning: true,
      maxProducts: 1000,
      maxCustomers: 500,
      advancedReports: true,
      prioritySupport: false,
      backupRetention: 30
    },
    limits: {
      products: 1000,
      customers: 500,
      transactionsPerDay: 200,
      stores: 1
    }
  },
  premium_pro: {
    id: 'premium_pro',
    name: 'Premium Pro',
    price: 299,
    priceYearly: 2990,
    features: {
      cloudSync: true,
      cloudRestore: true,
      barcodeScanning: true,
      maxProducts: 5000,
      maxCustomers: 2000,
      advancedReports: true,
      prioritySupport: true,
      backupRetention: 90
    },
    limits: {
      products: 5000,
      customers: 2000,
      transactionsPerDay: 500,
      stores: 2
    }
  },
  premium_unlimited: {
    id: 'premium_unlimited',
    name: 'Premium Unlimited',
    price: 499,
    priceYearly: 4990,
    features: {
      cloudSync: true,
      cloudRestore: true,
      barcodeScanning: true,
      maxProducts: Infinity,
      maxCustomers: Infinity,
      advancedReports: true,
      prioritySupport: true,
      backupRetention: 365
    },
    limits: {
      products: Infinity,
      customers: Infinity,
      transactionsPerDay: Infinity,
      stores: 10
    }
  }
};
