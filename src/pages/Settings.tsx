// src/pages/Settings.tsx

import React, { useState } from 'react';
import { 
  Store, Printer, Package, ShoppingCart, User, Shield, 
  Cloud, Database, Download, Upload, RefreshCw, 
  CheckCircle, AlertCircle, Eye, EyeOff, Save,
  Moon, Sun, Monitor, Smartphone, Crown, Star, ArrowRight
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { premiumService } from '../services/PremiumService';
import { PREMIUM_PLANS } from '../config/premiumPlans';
import { PremiumStatus } from '../types/premium';

type TabType = 'store' | 'receipt' | 'inventory' | 'pos' | 'preferences' | 'backup' | 'security' | 'premium';

export const Settings: React.FC = () => {
  const { settings, updateSettings, syncStatus, syncNow, exportSettings, importSettings, testSupabaseConnection } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<TabType>('store');
  const [showPin, setShowPin] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.backup.supabaseConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.backup.supabaseConfig?.anonKey || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [premiumStatus, setPremiumStatus] = React.useState<PremiumStatus | null>(null);

  React.useEffect(() => {
    premiumService.getPremiumStatus().then(setPremiumStatus);
  }, []);
  
  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'receipt', label: 'Receipt', icon: Printer },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'preferences', label: 'Preferences', icon: User },
    { id: 'backup', label: 'Backup & Sync', icon: Cloud },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'premium', label: 'Premium', icon: Crown }
  ];
  
  const handleTestConnection = async () => {
    setTestingConnection(true);
    const success = await testSupabaseConnection(supabaseUrl, supabaseKey);
    if (success) {
      updateSettings({
        backup: {
          ...settings.backup,
          supabaseConfig: { url: supabaseUrl, anonKey: supabaseKey }
        }
      });
    }
    setTestingConnection(false);
  };
  
  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sarisari-settings-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importSettings(content);
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-stone-50 p-4 lg:p-6 pb-32 lg:pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-stone-900 uppercase tracking-tight">Settings</h1>
            <p className="text-stone-500 font-medium text-sm">Customize your Sari-Sari POS experience</p>
          </div>
          <button
            onClick={() => toast.success('Settings saved automatically')}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
          >
            <Save size={20} />
            <span>Save Changes</span>
          </button>
        </div>
        
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Tabs Grid - All visible at once */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center space-y-2 px-2 py-4 rounded-2xl transition-all font-bold uppercase tracking-wider text-[9px] lg:text-[10px] text-center ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                    : 'bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <tab.icon size={18} />
                <span className="leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-4 lg:p-8">
            {/* Store Info Tab */}
            {activeTab === 'store' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Store Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Store Name</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => updateSettings({ storeName: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="Sari-Sari Store"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Contact Number</label>
                    <input
                      type="tel"
                      value={settings.storePhone}
                      onChange={(e) => updateSettings({ storePhone: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="09123456789"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Store Address</label>
                    <textarea
                      value={settings.storeAddress}
                      onChange={(e) => updateSettings({ storeAddress: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="Barangay, City, Province"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">TIN (Tax ID)</label>
                    <input
                      type="text"
                      value={settings.tin}
                      onChange={(e) => updateSettings({ tin: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="123-456-789-000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={settings.storeEmail || ''}
                      onChange={(e) => updateSettings({ storeEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="store@example.com"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Receipt Settings Tab */}
            {activeTab === 'receipt' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Receipt Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Paper Size</label>
                    <select
                      value={settings.receipt.paperSize}
                      onChange={(e) => updateSettings({
                        receipt: { ...settings.receipt, paperSize: e.target.value as '58' | '80' }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="58">58mm (Standard Thermal)</option>
                      <option value="80">80mm (Wide Thermal)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Number of Copies</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={settings.receipt.copies}
                      onChange={(e) => updateSettings({
                        receipt: { ...settings.receipt, copies: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Auto-print after sale</label>
                    <input
                      type="checkbox"
                      checked={settings.receipt.autoPrint}
                      onChange={(e) => updateSettings({
                        receipt: { ...settings.receipt, autoPrint: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Show QR Code</label>
                    <input
                      type="checkbox"
                      checked={settings.receipt.showQR}
                      onChange={(e) => updateSettings({
                        receipt: { ...settings.receipt, showQR: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Header Message</label>
                  <input
                    type="text"
                    value={settings.receipt.headerMessage}
                    onChange={(e) => updateSettings({
                      receipt: { ...settings.receipt, headerMessage: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Footer Message</label>
                  <textarea
                    value={settings.receipt.footerMessage}
                    onChange={(e) => updateSettings({
                      receipt: { ...settings.receipt, footerMessage: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="Thank you message"
                  />
                </div>
              </div>
            )}
            
            {/* Backup & Sync Tab */}
            {activeTab === 'backup' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Backup & Sync</h2>
                
                {/* Supabase Configuration */}
                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 space-y-6">
                  <div className="flex items-center space-x-3 text-indigo-900">
                    <Cloud size={24} />
                    <h3 className="text-lg font-black uppercase tracking-tight">Supabase Cloud Sync</h3>
                  </div>
                  <p className="text-sm text-indigo-600 font-medium">
                    Connect to Supabase for cloud backup and multi-device sync. Your data stays safe even if you lose your device.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">Supabase Project URL</label>
                      <input
                        type="text"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full px-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">Supabase Anon Key</label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={supabaseKey}
                          onChange={(e) => setSupabaseKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full px-4 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                        >
                          {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-indigo-100"
                      >
                        {testingConnection ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        <span>Test Connection</span>
                      </button>
                      
                      {settings.backup.supabaseConfig?.url && (
                        <div className="flex items-center text-emerald-600 font-bold text-sm">
                          <CheckCircle size={18} className="mr-2" />
                          Configured
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Sync Actions */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Sync Actions</h3>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={syncNow}
                      disabled={!settings.backup.supabaseConfig?.url || syncStatus.isSyncing}
                      className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-emerald-100"
                    >
                      {syncStatus.isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} />}
                      <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                    
                    <button
                      onClick={handleExport}
                      className="px-6 py-4 bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 flex items-center space-x-2 shadow-lg shadow-stone-200"
                    >
                      <Download size={18} />
                      <span>Export Settings</span>
                    </button>
                    
                    <label className="px-6 py-4 bg-stone-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-stone-900 flex items-center space-x-2 shadow-lg shadow-stone-200 cursor-pointer">
                      <Upload size={18} />
                      <span>Import Settings</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {syncStatus.lastSync && (
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                
                {/* Danger Zone */}
                <div className="pt-8 border-t border-red-100 space-y-4">
                  <h3 className="text-xs font-black text-red-400 uppercase tracking-widest">Danger Zone</h3>
                  <button
                    onClick={() => {
                      if (confirm('WARNING: This will delete ALL local data. Make sure you have a backup first!')) {
                        useSettingsStore.getState().clearLocalData();
                      }
                    }}
                    className="px-6 py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 flex items-center space-x-2 transition-all"
                  >
                    <Database size={18} />
                    <span>Clear All Local Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Inventory Settings Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Inventory Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={settings.inventory.lowStockThreshold}
                      onChange={(e) => updateSettings({
                        inventory: { ...settings.inventory, lowStockThreshold: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Default Unit Type</label>
                    <select
                      value={settings.inventory.defaultUnitType}
                      onChange={(e) => updateSettings({
                        inventory: { ...settings.inventory, defaultUnitType: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="piece">Piece (pc)</option>
                      <option value="pack">Pack</option>
                      <option value="case">Case</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="l">Liter (l)</option>
                      <option value="ml">Milliliter (ml)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Enable Expiry Tracking</label>
                    <input
                      type="checkbox"
                      checked={settings.inventory.enableExpiryTracking}
                      onChange={(e) => updateSettings({
                        inventory: { ...settings.inventory, enableExpiryTracking: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Auto Reorder Notification</label>
                    <input
                      type="checkbox"
                      checked={settings.inventory.autoReorder}
                      onChange={(e) => updateSettings({
                        inventory: { ...settings.inventory, autoReorder: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <div className="space-y-0.5">
                      <label className="text-sm font-bold text-stone-700">Enable "Tingi" Mode</label>
                      <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tight">Allow selling items by piece from a pack</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.inventory.enableTingiMode}
                      onChange={(e) => updateSettings({
                        inventory: { ...settings.inventory, enableTingiMode: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* POS Settings Tab */}
            {activeTab === 'pos' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">POS Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Default Payment Method</label>
                    <select
                      value={settings.pos.defaultPaymentMethod}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, defaultPaymentMethod: e.target.value as any }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="cash">Cash</option>
                      <option value="gcash">GCash</option>
                      <option value="maya">Maya</option>
                      <option value="credit">Credit (Utang)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Barcode Scanner Mode</label>
                    <select
                      value={settings.pos.barcodeMode}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, barcodeMode: e.target.value as any }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="manual">Manual Entry</option>
                      <option value="camera">Camera Only</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Detection Confidence</label>
                      <span className="text-xs font-black text-indigo-600">{(settings.pos.detectionConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.pos.detectionConfidence}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, detectionConfidence: parseFloat(e.target.value) }
                      })}
                      className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Enable Customer Selection</label>
                    <input
                      type="checkbox"
                      checked={settings.pos.enableCustomerSelection}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, enableCustomerSelection: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Quick Keys Enabled</label>
                    <input
                      type="checkbox"
                      checked={settings.pos.quickKeysEnabled}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, quickKeysEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <label className="text-sm font-bold text-stone-700">Auto Add to Cart on Scan</label>
                    <input
                      type="checkbox"
                      checked={settings.pos.autoAddToCart}
                      onChange={(e) => updateSettings({
                        pos: { ...settings.pos, autoAddToCart: e.target.checked }
                      })}
                      className="w-5 h-5 text-indigo-600 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">System Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Language</label>
                    <select
                      value={settings.preferences.language}
                      onChange={(e) => updateSettings({
                        preferences: { ...settings.preferences, language: e.target.value as any }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="english">English</option>
                      <option value="tagalog">Tagalog (Filipino)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'system', icon: Monitor, label: 'System' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings({
                            preferences: { ...settings.preferences, theme: t.id as any }
                          })}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                            settings.preferences.theme === t.id
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                              : 'border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200'
                          }`}
                        >
                          <t.icon size={20} />
                          <span className="text-[10px] font-black uppercase mt-1">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Currency Symbol</label>
                    <input
                      type="text"
                      value={settings.preferences.currencySymbol}
                      onChange={(e) => updateSettings({
                        preferences: { ...settings.preferences, currencySymbol: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Date Format</label>
                    <select
                      value={settings.preferences.dateFormat}
                      onChange={(e) => updateSettings({
                        preferences: { ...settings.preferences, dateFormat: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Notifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                      <label className="text-sm font-bold text-stone-700">Low Stock</label>
                      <input
                        type="checkbox"
                        checked={settings.preferences.notifications.lowStock}
                        onChange={(e) => updateSettings({
                          preferences: {
                            ...settings.preferences,
                            notifications: { ...settings.preferences.notifications, lowStock: e.target.checked }
                          }
                        })}
                        className="w-5 h-5 text-indigo-600 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                      <label className="text-sm font-bold text-stone-700">Daily Report</label>
                      <input
                        type="checkbox"
                        checked={settings.preferences.notifications.dailyReport}
                        onChange={(e) => updateSettings({
                          preferences: {
                            ...settings.preferences,
                            notifications: { ...settings.preferences.notifications, dailyReport: e.target.checked }
                          }
                        })}
                        className="w-5 h-5 text-indigo-600 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                      <label className="text-sm font-bold text-stone-700">Utang Reminder</label>
                      <input
                        type="checkbox"
                        checked={settings.preferences.notifications.utangReminder}
                        onChange={(e) => updateSettings({
                          preferences: {
                            ...settings.preferences,
                            notifications: { ...settings.preferences.notifications, utangReminder: e.target.checked }
                          }
                        })}
                        className="w-5 h-5 text-indigo-600 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                      <div className="space-y-0.5">
                        <label className="text-sm font-bold text-stone-700">Require PIN on Startup</label>
                        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tight">Protect your POS with a 4-digit PIN</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.security.requirePin}
                        onChange={(e) => updateSettings({
                          security: { ...settings.security, requirePin: e.target.checked }
                        })}
                        className="w-5 h-5 text-indigo-600 rounded-lg"
                      />
                    </div>
                    {settings.security.requirePin && (
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                        <label className="text-xs font-black text-indigo-400 uppercase tracking-widest">Set 4-Digit PIN</label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <input
                              key={i}
                              type="password"
                              maxLength={1}
                              className="w-12 h-12 text-center bg-white border-none rounded-xl text-xl font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                              placeholder="•"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                      <div className="space-y-0.5">
                        <label className="text-sm font-bold text-stone-700">Biometric Authentication</label>
                        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tight">Use Fingerprint or Face ID if available</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.security.biometricEnabled}
                        onChange={(e) => updateSettings({
                          security: { ...settings.security, biometricEnabled: e.target.checked }
                        })}
                        className="w-5 h-5 text-indigo-600 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Auto-Lock Session (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSettings({
                          security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Tab */}
            {activeTab === 'premium' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Premium Subscription</h2>
                    <p className="text-stone-500 font-medium text-sm">Manage your plan and unlock advanced features</p>
                  </div>
                  <Link 
                    to="/premium" 
                    className="w-full md:w-auto bg-amber-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all transform active:scale-95"
                  >
                    <Crown size={18} />
                    <span>Upgrade to Pro</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-4">
                    <div className="flex items-center space-x-3 text-stone-900">
                      <Star className="w-5 h-5 text-amber-500" />
                      <h3 className="font-black uppercase tracking-tight">Current Plan</h3>
                    </div>
                    <p className="text-2xl font-black text-indigo-900 uppercase">{premiumStatus?.plan || 'Free'}</p>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                        <span>Usage</span>
                        <span>{premiumStatus?.usage.products || 0} / {premiumStatus?.limits.products === Infinity ? '∞' : premiumStatus?.limits.products}</span>
                      </div>
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600" 
                          style={{ width: `${Math.min(100, ((premiumStatus?.usage.products || 0) / (premiumStatus?.limits.products || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
                    <h3 className="font-black text-indigo-900 uppercase tracking-tight flex items-center">
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Premium Benefits
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        'Cloud Backup & Sync',
                        'Unlimited Products',
                        'Multi-store Support',
                        'Advanced Analytics',
                        'Priority Support',
                        'Custom Branding'
                      ].map((benefit, i) => (
                        <div key={i} className="flex items-center text-sm font-bold text-indigo-700">
                          <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-stone-200">
                  <h3 className="font-black text-stone-900 uppercase tracking-tight mb-4">Subscription Details</h3>
                  {premiumStatus?.isPremium ? (
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-stone-100">
                        <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">Status</span>
                        <span className="text-emerald-600 font-black uppercase tracking-tight">Active</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-stone-100">
                        <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">Renewal Date</span>
                        <span className="text-stone-900 font-black tracking-tight">
                          {premiumStatus.subscription?.endDate ? new Date(premiumStatus.subscription.endDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">Payment Method</span>
                        <span className="text-stone-900 font-black uppercase tracking-tight">
                          {premiumStatus.subscription?.paymentMethod || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-stone-500 font-medium mb-4">You are currently on the Free plan.</p>
                      <Link to="/premium" className="text-indigo-600 font-black uppercase tracking-widest text-xs flex items-center justify-center hover:underline">
                        View all plans <ArrowRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Spacer for Mobile Nav */}
        <div className="h-24 lg:hidden" />
      </div>
    </div>
  );
};
