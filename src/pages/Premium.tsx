import React, { useState, useEffect } from 'react';
import { Check, Crown, Star, TrendingUp, Cloud, Database, Users, BarChart, Smartphone, Shield, CreditCard, ArrowLeft } from 'lucide-react';
import { PREMIUM_PLANS } from '../config/premiumPlans';
import { premiumService } from '../services/PremiumService';
import { PremiumStatus, PlanType } from '../types/premium';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const Premium: React.FC = () => {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium_lite');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  
  useEffect(() => {
    loadStatus();
  }, []);
  
  const loadStatus = async () => {
    setLoading(true);
    const premiumStatus = await premiumService.getPremiumStatus();
    setStatus(premiumStatus);
    if (premiumStatus.plan !== 'free') {
      setSelectedPlan(premiumStatus.plan);
    }
    setLoading(false);
  };
  
  const handlePayMongo = async () => {
    if (selectedPlan === 'free') return;
    
    try {
      const checkoutUrl = await premiumService.createPayMongoLink(selectedPlan);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('PayMongo error:', error);
      toast.error(error.message || 'Failed to create payment link');
    }
  };
  
  const isCurrentPlan = (planId: string) => {
    return status?.plan === planId && status?.isPremium;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/settings" className="inline-flex items-center text-stone-500 hover:text-stone-800 mb-8 font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} className="mr-2" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-3xl mb-6 shadow-lg shadow-indigo-100">
            <Crown className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-stone-900 mb-4 tracking-tight uppercase">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto font-medium">
            Unlock cloud sync, unlimited products, and advanced features to grow your sari-sari store business.
          </p>
        </div>
        
        {/* Current Plan Status */}
        {status?.isPremium && (
          <div className="max-w-3xl mx-auto mb-12 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <Star className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-emerald-900 uppercase tracking-tight">Current Plan: {PREMIUM_PLANS[status.plan].name}</p>
                  <p className="text-sm text-emerald-600 font-bold">
                    {status.subscription?.endDate ? `Valid until ${new Date(status.subscription.endDate).toLocaleDateString()}` : 'Active'}
                  </p>
                </div>
              </div>
              {status.plan !== 'premium_unlimited' && (
                <button className="bg-white px-4 py-2 rounded-xl text-emerald-600 font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
                  Manage
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-stone-200 flex">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:bg-stone-100 ${
                billingInterval === 'month'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center active:bg-stone-100 ${
                billingInterval === 'year'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Yearly
              <span className="ml-2 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md text-[10px]">-17%</span>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {(['premium_lite', 'premium_pro', 'premium_unlimited'] as const).map(planId => {
            const plan = PREMIUM_PLANS[planId];
            const isPopular = planId === 'premium_lite';
            const price = billingInterval === 'month' ? plan.price : plan.priceYearly;
            const priceLabel = billingInterval === 'month' ? '/mo' : '/yr';
            
            return (
              <div
                key={planId}
                className={`relative bg-white rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-xl border-2 cursor-pointer active:scale-[0.98] ${
                  selectedPlan === planId ? 'border-indigo-600 scale-105 z-10' : 'border-stone-100'
                } ${isCurrentPlan(planId) ? 'bg-indigo-50/30' : ''}`}
                onClick={() => setSelectedPlan(planId)}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                    Sulit!
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-black text-stone-900">₱{price}</span>
                    <span className="text-stone-400 font-bold ml-1">{priceLabel}</span>
                  </div>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">billed {billingInterval === 'month' ? 'monthly' : 'annually'}</p>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center text-sm text-stone-600 font-medium">
                      <div className="p-1 bg-emerald-100 rounded-full mr-3">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      {plan.limits.transactionsPerDay === Infinity ? 'Unlimited' : plan.limits.transactionsPerDay.toLocaleString()} transactions/day
                    </div>
                    {plan.features.cloudSync && (
                      <div className="flex items-center text-sm text-stone-600 font-medium">
                        <div className="p-1 bg-emerald-100 rounded-full mr-3">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        Cloud backup & sync
                      </div>
                    )}
                    <div className="flex items-center text-sm text-stone-600 font-medium">
                      <div className="p-1 bg-emerald-100 rounded-full mr-3">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      Up to {plan.limits.products === Infinity ? 'Unlimited' : plan.limits.products.toLocaleString()} products
                    </div>
                    {plan.features.advancedReports && (
                      <div className="flex items-center text-sm text-stone-600 font-medium">
                        <div className="p-1 bg-emerald-100 rounded-full mr-3">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        Advanced analytics
                      </div>
                    )}
                    {plan.features.prioritySupport && (
                      <div className="flex items-center text-sm text-stone-600 font-medium">
                        <div className="p-1 bg-emerald-100 rounded-full mr-3">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        Priority support
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayMongo();
                    }}
                    disabled={isCurrentPlan(planId)}
                    className={`mt-10 w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all transform active:bg-opacity-90 ${
                      isCurrentPlan(planId)
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                    }`}
                  >
                    {isCurrentPlan(planId) ? 'Current Plan' : `Get ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Feature Comparison */}
        <div className="mt-20 bg-white rounded-3xl shadow-sm overflow-hidden border border-stone-200">
          <div className="p-8 border-b border-stone-100 bg-stone-50">
            <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-8 py-4 text-left text-xs font-black text-stone-400 uppercase tracking-widest">Feature</th>
                  <th className="px-8 py-4 text-center text-xs font-black text-stone-400 uppercase tracking-widest">Free</th>
                  <th className="px-8 py-4 text-center text-xs font-black text-stone-400 uppercase tracking-widest">Lite</th>
                  <th className="px-8 py-4 text-center text-xs font-black text-stone-400 uppercase tracking-widest">Pro</th>
                  <th className="px-8 py-4 text-center text-xs font-black text-stone-400 uppercase tracking-widest">Unlimited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                <tr>
                  <td className="px-8 py-5 text-sm font-bold text-stone-700">Daily Transactions</td>
                  <td className="px-8 py-5 text-center font-black">50</td>
                  <td className="px-8 py-5 text-center font-black">200</td>
                  <td className="px-8 py-5 text-center font-black">500</td>
                  <td className="px-8 py-5 text-center font-black">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-8 py-5 text-sm font-bold text-stone-700">Cloud Sync</td>
                  <td className="px-8 py-5 text-center text-stone-300">❌</td>
                  <td className="px-8 py-5 text-center text-emerald-500">✅</td>
                  <td className="px-8 py-5 text-center text-emerald-500">✅</td>
                  <td className="px-8 py-5 text-center text-emerald-500">✅</td>
                </tr>
                <tr>
                  <td className="px-8 py-5 text-sm font-bold text-stone-700">Max Products</td>
                  <td className="px-8 py-5 text-center font-black">100</td>
                  <td className="px-8 py-5 text-center font-black">1,000</td>
                  <td className="px-8 py-5 text-center font-black">5,000</td>
                  <td className="px-8 py-5 text-center font-black">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-8 py-5 text-sm font-bold text-stone-700">Multi-store</td>
                  <td className="px-8 py-5 text-center text-stone-300">❌</td>
                  <td className="px-8 py-5 text-center text-stone-300">❌</td>
                  <td className="px-8 py-5 text-center font-black">2 stores</td>
                  <td className="px-8 py-5 text-center font-black">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
