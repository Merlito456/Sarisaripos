export type PlanType = 'free' | 'premium_lite' | 'premium_pro' | 'premium_unlimited';

export interface PremiumPlan {
  id: PlanType;
  name: string;
  price: number;
  priceYearly: number;
  features: {
    cloudSync: boolean;
    barcodeScanning: boolean;
    maxProducts: number;
    maxCustomers: number;
    advancedReports: boolean;
    prioritySupport: boolean;
    backupRetention: number;
  };
  limits: {
    products: number;
    customers: number;
    transactionsPerDay: number;
    stores: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanType;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: 'stripe' | 'paymongo' | 'manual';
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  dailyTransactionLimit?: number;
}

export interface PremiumStatus {
  isPremium: boolean;
  plan: PlanType;
  features: PremiumPlan['features'];
  limits: PremiumPlan['limits'];
  usage: {
    products: number;
    customers: number;
    transactionsToday: number;
    stores: number;
  };
  subscription: Subscription | null;
}
