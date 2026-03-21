import { PREMIUM_PLANS } from '../config/premiumPlans';
import { PremiumStatus, PlanType, Subscription } from '../types/premium';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../database/db';

class PremiumService {
  async getPremiumStatus(userId?: string): Promise<PremiumStatus> {
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
            nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined
          };
        }
      }
      
      const planId: PlanType = subscription?.planId || 'free';
      const plan = PREMIUM_PLANS[planId];
      
      // Get current usage counts
      const usage = await this.getCurrentUsage();
      
      return {
        isPremium: planId !== 'free',
        plan: planId,
        features: plan.features,
        limits: plan.limits,
        usage,
        subscription
      };
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
  
  async createCheckoutSession(planId: PlanType, interval: 'month' | 'year'): Promise<string> {
    // Integrate with Stripe or PayMongo
    // This would call your backend endpoint that creates a Stripe Checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, interval })
    });
    const { sessionId } = await response.json();
    return sessionId;
  }
  
  async createPayMongoLink(planId: PlanType): Promise<string> {
    // PayMongo integration for Philippine payments
    const response = await fetch('/api/create-paymongo-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const { checkoutUrl } = await response.json();
    return checkoutUrl;
  }
}

export const premiumService = new PremiumService();
