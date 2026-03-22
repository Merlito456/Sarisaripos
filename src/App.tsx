import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings as SettingsIcon, Menu, X, Crown, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

import Dashboard from './pages/Dashboard';
import CameraPOS from './components/POS/CameraPOS';
import Inventory from './pages/Inventory';
import { Customers } from './pages/Customers';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Premium } from './pages/Premium';
import Auth from './pages/Auth';
import { seedDatabase } from './database/db';
import { useSettingsStore } from './store/useSettingsStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { syncStatus } = useSettingsStore();

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { path: '/pos', icon: <ShoppingCart size={20} />, label: 'POS' },
    { path: '/inventory', icon: <Package size={20} />, label: 'Stock' },
    { path: '/customers', icon: <Users size={20} />, label: 'Suki' },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Stats' },
    { path: '/settings', icon: <SettingsIcon size={20} />, label: 'Set' },
  ];

  return (
    <div className="flex h-screen bg-stone-100 font-sans text-stone-900 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <ShoppingCart size={18} />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase text-indigo-900">Sari-Sari <span className="text-indigo-600">POS</span></h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-stone-100 rounded-xl text-stone-600"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:relative z-50 w-72 h-full bg-white border-r border-stone-200 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShoppingCart size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-indigo-900">Sari-Sari <span className="text-indigo-600">POS</span></h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-stone-100 rounded-xl text-stone-400"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all group ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                  : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
              }`}
            >
              <span className={`${location.pathname === item.path ? 'text-white' : 'text-stone-300 group-hover:text-indigo-400'}`}>
                {item.icon}
              </span>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          ))}

          <Link
            to="/premium"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all group mt-4 ${
              location.pathname === '/premium'
                ? 'bg-amber-500 text-white shadow-xl shadow-amber-100'
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            <span className={`${location.pathname === '/premium' ? 'text-white' : 'text-amber-500'}`}>
              <Crown size={20} />
            </span>
            <span className="tracking-tight">Upgrade to Pro</span>
          </Link>
        </nav>

        <div className="p-6 mt-auto space-y-4">
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <ShoppingCart size={80} />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Store Status</div>
              <div className="text-indigo-900 font-bold flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${syncStatus.isSyncing ? 'bg-amber-500 animate-spin' : syncStatus.error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                {syncStatus.isSyncing ? 'Syncing...' : syncStatus.error ? 'Sync Error' : 'Online & Synced'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut size={20} className="group-hover:text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0 pb-28 lg:pb-0">
        <Toaster position="top-right" />
        <div className="h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-1 py-2 flex items-center justify-around z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all ${
              location.pathname === item.path
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-stone-400'
            }`}
          >
            <div className={location.pathname === item.path ? 'scale-110' : ''}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function AppContent() {
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      import('./detection/DetectionManager').then(({ detectionManager }) => {
        detectionManager.setUserId(user.id);
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white animate-bounce">
            <ShoppingCart size={24} />
          </div>
          <div className="text-indigo-900 font-black tracking-tighter uppercase">Loading Sari-Sari POS...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" />
        <Auth />
      </>
    );
  }

  // Set user ID for detection manager
  import('./detection/DetectionManager').then(({ detectionManager }) => {
    detectionManager.setUserId(user.id);
  });

  return (
    <Layout onLogout={signOut}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><CameraPOS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/premium" element={<Premium />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
