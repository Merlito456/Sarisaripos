// src/store/useSettingsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreSettings, SyncStatus } from '../types/settings';
import { supabaseSync } from '../services/SupabaseSyncService';
import { initSupabase } from '../lib/supabase';
import { db } from '../database/db';
import toast from 'react-hot-toast';

interface SettingsState {
  settings: StoreSettings;
  syncStatus: SyncStatus;
  isLoading: boolean;
  
  // Actions
  updateSettings: (updates: Partial<StoreSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
  testSupabaseConnection: (url: string, anonKey: string) => Promise<boolean>;
  syncNow: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  storeName: 'Sari-Sari Store',
  storeAddress: 'Barangay, City, Philippines',
  storePhone: '09123456789',
  tin: '',
  receipt: {
    paperSize: '58',
    autoPrint: true,
    copies: 1,
    showLogo: false,
    showQR: false,
    footerMessage: 'MARAMING SALAMAT PO! PAULI-ULI PO KAYO!',
    headerMessage: 'SARI-SARI STORE',
    thermalPrinter: {
      enabled: false,
      type: 'bluetooth'
    }
  },
  inventory: {
    inventoryEnabled: true,
    lowStockThreshold: 10,
    enableExpiryTracking: false,
    autoReorder: false,
    defaultUnitType: 'piece',
    enableTingiMode: true
  },
  pos: {
    defaultPaymentMethod: 'cash',
    enableCustomerSelection: true,
    quickKeysEnabled: true,
    autoAddToCart: true,
    barcodeMode: 'auto',
    detectionConfidence: 0.65
  },
  preferences: {
    language: 'english',
    theme: 'light',
    currencySymbol: '₱',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    notifications: {
      lowStock: true,
      dailyReport: true,
      utangReminder: true
    }
  },
  backup: {
    autoSync: false,
    syncFrequency: 'daily',
    cloudProvider: 'none'
  },
  security: {
    requirePin: false,
    biometricEnabled: false,
    sessionTimeout: 30
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      syncStatus: {
        isOnline: navigator.onLine,
        isSyncing: false,
        lastSync: null,
        pendingSync: 0,
        syncProgress: 0,
        error: null
      },
      isLoading: false,
      
      updateSettings: (updates) => {
        set((state) => {
          const newSettings = { ...state.settings, ...updates };
          
          // Re-initialize Supabase if credentials changed
          const newBackup = updates.backup;
          if (newBackup?.supabaseConfig?.url && newBackup?.supabaseConfig?.anonKey) {
            initSupabase(newBackup.supabaseConfig.url, newBackup.supabaseConfig.anonKey);
          }

          // Sync settings to cloud if configured
          if (supabaseSync.isConfigured()) {
            supabaseSync.syncSettings(newSettings);
          }

          return { settings: newSettings };
        });
      },
      
      resetSettings: () => {
        set({ settings: defaultSettings });
        toast.success('Settings reset to default');
      },
      
      exportSettings: () => {
        const { settings } = get();
        return JSON.stringify(settings, null, 2);
      },
      
      importSettings: (json: string) => {
        try {
          const imported = JSON.parse(json);
          set({ settings: imported });
          toast.success('Settings imported successfully');
          return true;
        } catch (error) {
          toast.error('Invalid settings file');
          return false;
        }
      },
      
      testSupabaseConnection: async (url: string, anonKey: string) => {
        try {
          const initialized = initSupabase(url, anonKey);
          if (!initialized) return false;
          
          const { getSupabase } = await import('../lib/supabase');
          const supabase = getSupabase();
          
          // Test with a simple query
          const { error } = await supabase
            .from('products')
            .select('count')
            .limit(1);
          
          if (error) throw error;
          
          toast.success('Supabase connection successful!');
          return true;
        } catch (error: any) {
          toast.error('Connection failed: ' + error.message);
          return false;
        }
      },
      
      syncNow: async () => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, isSyncing: true, error: null }
        }));
        
        try {
          const result = await supabaseSync.syncToCloud();
          
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              isSyncing: false,
              lastSync: result.timestamp,
              pendingSync: 0,
              error: result.errors.length > 0 ? result.errors[0] : null
            }
          }));
          
          if (result.success) {
            toast.success(`Synced ${result.productsSynced} items`);
          }
        } catch (error: any) {
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              isSyncing: false,
              error: error.message
            }
          }));
        }
      },
      
      restoreFromCloud: async () => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, isSyncing: true, error: null }
        }));
        
        try {
          const result = await supabaseSync.restoreFromCloud(false); // false means pull everything
          
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              isSyncing: false,
              lastSync: result.timestamp,
              pendingSync: 0,
              error: result.errors.length > 0 ? result.errors[0] : null
            }
          }));
          
          if (result.success) {
            toast.success(`Restored ${result.productsSynced} items from cloud`);
          }
        } catch (error: any) {
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              isSyncing: false,
              error: error.message
            }
          }));
          toast.error('Restore failed: ' + error.message);
        }
      },
      
      clearLocalData: async () => {
        await db.delete();
        await db.open();
        toast.success('Local data cleared');
        window.location.reload();
      }
    }),
    {
      name: 'store-settings',
      partialize: (state) => ({ settings: state.settings })
    }
  )
);
