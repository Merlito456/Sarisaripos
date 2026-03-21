// src/types/settings.ts

export interface StoreSettings {
  // Basic Info
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail?: string;
  storeLogo?: string; // base64 or URL
  tin: string; // Tax Identification Number
  businessPermit?: string;
  
  // Receipt Settings
  receipt: {
    paperSize: '58' | '80';
    autoPrint: boolean;
    copies: number;
    showLogo: boolean;
    showQR: boolean;
    footerMessage: string;
    headerMessage: string;
    thermalPrinter: {
      enabled: boolean;
      type: 'bluetooth' | 'usb' | 'network';
      deviceId?: string;
    };
  };
  
  // Inventory Settings
  inventory: {
    inventoryEnabled: boolean;
    lowStockThreshold: number;
    enableExpiryTracking: boolean;
    autoReorder: boolean;
    defaultUnitType: string;
    enableTingiMode: boolean;
  };
  
  // POS Settings
  pos: {
    defaultPaymentMethod: 'cash' | 'gcash' | 'maya';
    enableCustomerSelection: boolean;
    quickKeysEnabled: boolean;
    autoAddToCart: boolean;
    barcodeMode: 'auto' | 'manual';
    detectionConfidence: number; // 0-1
  };
  
  // User Preferences
  preferences: {
    language: 'filipino' | 'english' | 'taglish';
    theme: 'light' | 'dark' | 'system';
    currencySymbol: string;
    dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
    timeFormat: '12h' | '24h';
    notifications: {
      lowStock: boolean;
      dailyReport: boolean;
      utangReminder: boolean;
    };
  };
  
  // Backup & Sync
  backup: {
    autoSync: boolean;
    syncFrequency: 'daily' | 'weekly' | 'manual';
    lastSync?: Date;
    cloudProvider: 'supabase' | 'none';
    supabaseConfig?: {
      url: string;
      anonKey: string;
      projectId?: string;
    };
  };
  
  // Privacy & Security
  security: {
    requirePin: boolean;
    pinCode?: string;
    biometricEnabled: boolean;
    sessionTimeout: number; // minutes
  };
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingSync: number;
  syncProgress: number;
  error: string | null;
}
