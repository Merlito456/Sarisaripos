// src/lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to environment variables
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || '';
const defaultAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseUrl = defaultUrl;
let supabaseAnonKey = defaultAnonKey;
let supabaseInstance: SupabaseClient | null = null;

// Initialize with defaults if available
if (defaultUrl && defaultAnonKey) {
  try {
    supabaseInstance = createClient(defaultUrl, defaultAnonKey);
    console.log('Supabase initialized with environment variables');
  } catch (error) {
    console.error('Failed to initialize Supabase with environment variables:', error);
  }
}

export const initSupabase = (url: string, anonKey: string) => {
  supabaseUrl = url;
  supabaseAnonKey = anonKey;
  
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
      console.log('Supabase re-initialized');
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

export const supabase = supabaseInstance;

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey && !!supabaseInstance;
};
