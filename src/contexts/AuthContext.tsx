import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlanType } from '../types/premium';

interface AuthContextType {
  user: User | null;
  userPlan: PlanType;
  isLoading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshPlan: () => Promise<void>;
  upgradeToPremium: (planId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isPremium = userPlan !== 'free';

  const fetchUserPlan = async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status, end_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.status === 'active') {
        // Check if subscription is expired
        if (data.end_date && new Date(data.end_date) < new Date()) {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'expired' })
            .eq('user_id', userId);
          setUserPlan('free');
        } else {
          setUserPlan(data.plan_type as any);
        }
      } else {
        setUserPlan('free');
      }
    } catch (error) {
      console.error('Failed to fetch user plan:', error);
      setUserPlan('free');
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setIsLoading(false);
          return;
        }

        const supabase = getSupabase();
        
        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserPlan(session.user.id);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserPlan(session.user.id);
          } else {
            setUserPlan('free');
          }
          setIsLoading(false);
        });

        unsubscribe = () => subscription.unsubscribe();
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const refreshPlan = async () => {
    if (user) {
      await fetchUserPlan(user.id);
    }
  };

  const upgradeToPremium = async (planId: string) => {
    // This will redirect to payment page
    navigate(`/premium?plan=${planId}`);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userPlan,
      isLoading,
      isPremium,
      signOut,
      refreshPlan,
      upgradeToPremium
    }}>
      {children}
    </AuthContext.Provider>
  );
};
