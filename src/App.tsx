import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Settings as SettingsIcon, Menu, X, Crown, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
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

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-red-900 text-center mb-2 tracking-tighter uppercase">App Crashed</h1>
            <p className="text-red-600 text-center mb-6 font-medium">Something went wrong while loading the page.</p>
            
            <div className="bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-200 overflow-hidden">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Error Message</div>
              <div className="text-xs font-mono text-stone-600 break-words">
                {this.state.error?.message || "Unknown Error"}
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <RefreshCw size={20} />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <div className="flex h-full bg-stone-100 font-sans text-stone-900 overflow-hidden">
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
      <main className="flex-1 overflow-y-auto relative pt-16 lg:pt-0 pb-28 lg:pb-0 bg-white min-h-0">
        <Toaster position="top-right" />
        <div className="min-h-full flex flex-col">
          <div className="bg-indigo-600 text-white text-[10px] p-1 text-center font-bold uppercase tracking-widest z-50">
            --- Content Start ---
          </div>
          <div className="flex-1 bg-stone-50">
            {children}
          </div>
          <div className="bg-indigo-600 text-white text-[10px] p-1 text-center font-bold uppercase tracking-widest z-50">
            --- Content End ---
          </div>
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  // Global log function for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    const addLog = (msg: string, type: 'log' | 'error' = 'log') => {
      setLogs(prev => [msg.slice(0, 100), ...prev].slice(0, 10));
    };

    console.log = (...args) => {
      addLog(args.map(String).join(' '));
      originalLog(...args);
    };
    console.error = (...args) => {
      addLog(args.map(String).join(' '), 'error');
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    document.title = 'Sari-Sari POS';
    
    const initDb = async () => {
      console.log("Starting DB Init...");
      try {
        await seedDatabase();
        console.log("DB Seeded");
        const { masterProductService } = await import('./services/MasterProductService');
        const count = await masterProductService.getLocalCount();
        console.log("Master count:", count);
        if (count === 0) {
          console.log('Seeding master products...');
          await masterProductService.seedFromLocalJson();
          console.log('Master seeded');
        }
      } catch (err) {
        console.error("DB Error:", err);
      }
    };

    initDb();
    
    if (user) {
      import('./detection/DetectionManager').then(({ detectionManager }) => {
        detectionManager.setUserId(user.id);
      });
    }
    
    // Debug info for WebView
    const info = [
      `User: ${user ? 'Logged In' : 'None'}`,
      `Loading: ${isLoading}`,
      `Path: ${window.location.hash || '/'}`,
      `Size: ${window.innerWidth}x${window.innerHeight}`
    ].join(' | ');
    setDebugInfo(info);
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white animate-bounce">
            <ShoppingCart size={24} />
          </div>
          <div className="text-indigo-900 font-black tracking-tighter uppercase">Loading...</div>
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

  return (
    <Layout onLogout={signOut}>
      {/* Debug Overlay - Visible for troubleshooting */}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none bg-black/90 text-white p-1 text-[9px] font-mono">
        <div className="flex justify-center border-b border-white/20 pb-1 mb-1">{debugInfo}</div>
        <div className="max-h-20 overflow-hidden opacity-80">
          {logs.map((log, i) => (
            <div key={i} className="truncate border-l-2 border-indigo-500 pl-1 mb-0.5">{log}</div>
          ))}
        </div>
      </div>
      
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><CameraPOS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/test" element={<div className="p-10 bg-green-500 text-white font-bold">TEST PAGE WORKING</div>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}
