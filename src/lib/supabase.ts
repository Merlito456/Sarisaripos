// src/lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be set by user in settings
let supabaseUrl = '';
let supabaseAnonKey = '';
let supabaseInstance: SupabaseClient | null = null;

export const initSupabase = (url: string, anonKey: string) => {
  supabaseUrl = url;
  supabaseAnonKey = anonKey;
  
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
      console.log('Supabase initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }
  return false;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized. Please configure in settings.');
  }
  return supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey && !!supabaseInstance;
};
