import { PREMIUM_PLANS } from '../config/premiumPlans';
import { PremiumStatus, PlanType, Subscription } from '../types/premium';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../database/db';

class PremiumService {
  private cachedStatus: PremiumStatus | null = null;
  private lastFetchTime: number = 0;
  private CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

  async getPremiumStatus(userId?: string): Promise<PremiumStatus> {
    // Return cached status if valid and not expired
    if (this.cachedStatus && !userId && (Date.now() - this.lastFetchTime < this.CACHE_DURATION)) {
      return this.cachedStatus;
    }

    try {
      const supabase = getSupabase();
      let subscription: Subscription | null = null;
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id;
      }
      
      if (effectiveUserId) {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', effectiveUserId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (!error && data) {
          subscription = {
            id: data.id,
            userId: data.user_id,
            planId: data.plan_type,
            status: data.status,
            startDate: new Date(data.start_date),
            endDate: data.end_date ? new Date(data.end_date) : undefined,
            autoRenew: data.auto_renew,
            paymentMethod: data.payment_method,
            lastPaymentDate: data.last_payment_date ? new Date(data.last_payment_date) : undefined,
            nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined,
            dailyTransactionLimit: data.daily_transaction_limit
          };
        }
      }
      
      const planId: PlanType = subscription?.planId || 'free';
      const plan = PREMIUM_PLANS[planId];
      
      // Use limits from DB if available, otherwise fallback to hardcoded config
      const limits = {
        ...plan.limits,
        transactionsPerDay: subscription?.dailyTransactionLimit || plan.limits.transactionsPerDay
      };
      
      // Get current usage counts
      const usage = await this.getCurrentUsage();
      
      const status = {
        isPremium: planId !== 'free',
        plan: planId,
        features: plan.features,
        limits,
        usage,
        subscription
      };

      // Cache the result
      if (!userId) {
        this.cachedStatus = status;
        this.lastFetchTime = Date.now();
      }

      return status;
    } catch (error) {
      console.error('Failed to get premium status:', error);
      return this.getFreePlanStatus();
    }
  }
  
  private async getCurrentUsage() {
    const products = await db.products.count();
    const customers = await db.customers.count();
    
    // Get today's transactions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const transactions = await db.transactions
      .where('timestamp')
      .above(startOfDay)
      .count();
    
    // For multi-store, you'd have a stores table
    const stores = 1; // Default
    
    return {
      products,
      customers,
      transactionsToday: transactions,
      stores
    };
  }
  
  private getFreePlanStatus(): PremiumStatus {
    const plan = PREMIUM_PLANS.free;
    return {
      isPremium: false,
      plan: 'free',
      features: plan.features,
      limits: plan.limits,
      usage: {
        products: 0,
        customers: 0,
        transactionsToday: 0,
        stores: 1
      },
      subscription: null
    };
  }
  
  async canAddProduct(): Promise<boolean> {
    const status = await this.getPremiumStatus();
    const { products } = status.usage;
    return products < status.limits.products;
  }
  
  async canAddCustomer(): Promise<boolean> {
    const status = await this.getPremiumStatus();
    const { customers } = status.usage;
    return customers < status.limits.customers;
  }
  
  async canAddTransaction(): Promise<boolean> {
    const status = await this.getPremiumStatus();
    const { transactionsToday } = status.usage;
    return transactionsToday < status.limits.transactionsPerDay;
  }

  async isUserPremium(userId?: string): Promise<boolean> {
    const status = await this.getPremiumStatus(userId);
    return status.isPremium;
  }
  
  async createPayMongoLink(planId: PlanType): Promise<string> {
    try {
      const response = await fetch('/api/create-paymongo-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('The server did not return a valid JSON response. Please check if your backend is running.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }
      
      if (!data.checkoutUrl) throw new Error('No checkout URL returned from server');
      return data.checkoutUrl;
    } catch (error: any) {
      console.error('PayMongo link error:', error);
      throw error;
    }
  }
}

export const premiumService = new PremiumService();
