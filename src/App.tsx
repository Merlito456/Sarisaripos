import React, { useState, useEffect, ErrorInfo, ReactNode, Component } from 'react';
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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
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

  useEffect(() => {
    console.log("LAYOUT MOUNTED - Path: " + location.pathname);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/inventory', icon: Package, label: 'Stock' },
    { path: '/customers', icon: Users, label: 'Suki' },
    { path: '/reports', icon: BarChart3, label: 'Stats' },
    { path: '/settings', icon: SettingsIcon, label: 'Set' },
  ];

  return (
    <div className="fixed inset-0 bg-stone-100 font-sans text-stone-900 overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white border-b border-stone-200 px-4 flex items-center justify-between shadow-sm">
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
            className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        id="sidebar"
        className={`fixed lg:absolute z-[70] w-72 h-full bg-white border-r border-stone-200 flex flex-col shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out will-change-transform ${
          isSidebarOpen ? 'translate-x-0 opacity-100 visible' : '-translate-x-full lg:translate-x-0 lg:opacity-100 lg:visible opacity-0 invisible pointer-events-none lg:pointer-events-auto'
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
          {navItems.map((item) => {
            const Icon = item.icon as any;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all group active:bg-stone-50 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                    : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-stone-300 group-hover:text-indigo-400'}`}>
                  <Icon size={20} />
                </span>
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/premium"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold transition-all group mt-4 active:bg-amber-100 ${
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
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all group active:bg-red-50"
          >
            <LogOut size={20} className="group-hover:text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Content Scroll Area */}
      <div className="absolute top-16 lg:top-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 lg:left-72 right-0 overflow-y-auto bg-stone-100 touch-pan-y">
        <Toaster position="top-right" />
        <div className="min-h-full flex flex-col bg-white">
          <div className="flex-1 p-4 relative z-10">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-stone-200 px-1 py-2 flex items-center justify-around z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-transform duration-200 ${isActive ? 'bg-indigo-50 scale-110' : ''}`}>
                <Icon size={22} />
              </div>
              <span className="text-[9px] font-black mt-0.5 uppercase tracking-tighter text-center leading-none">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 w-1 h-1 bg-indigo-600 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AppContent() {
  const { user, isLoading, signOut } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const location = useLocation();

  // Global log function for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    const addLog = (msg: string) => {
      setLogs(prev => [msg.slice(0, 150), ...prev].slice(0, 30));
    };

    console.log = (...args) => {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      addLog(msg);
      originalLog(...args);
    };
    console.error = (...args) => {
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      addLog("!!! ERROR: " + msg);
      originalError(...args);
    };

    window.onerror = (message, source, lineno, colno, error) => {
      addLog(`GLOBAL ERROR: ${message} at ${source}:${lineno}:${colno}`);
      return false;
    };

    window.onunhandledrejection = (event) => {
      addLog(`PROMISE REJECTION: ${event.reason}`);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);

  useEffect(() => {
    document.title = 'Sari-Sari POS';
    
    const initDb = async () => {
      console.log("DB Init Start");
      try {
        await seedDatabase();
        console.log("DB Seeded");
        const { masterProductService } = await import('./services/MasterProductService');
        const count = await masterProductService.getLocalCount();
        console.log("Master count: " + count);
        if (count === 0) {
          console.log('Seeding master products...');
          await masterProductService.seedFromLocalJson();
          console.log('Master seeded');
        }
      } catch (err) {
        console.error("DB Error: " + (err instanceof Error ? err.message : String(err)));
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
      `Path: ${location.pathname}${location.hash}`,
      `Size: ${window.innerWidth}x${window.innerHeight}`
    ].join(' | ');
    setDebugInfo(info);
  }, [user, isLoading, location]);

  useEffect(() => {
    const logDimensions = () => {
      const info = {
        width: window.innerWidth,
        height: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
        href: window.location.href,
        hash: window.location.hash
      };
      console.log("DEBUG DIMENSIONS: " + JSON.stringify(info));
    };

    logDimensions();
    window.addEventListener('resize', logDimensions);
    return () => window.removeEventListener('resize', logDimensions);
  }, []);

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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><CameraPOS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
        <Route path="/test-render" element={<div className="bg-red-500 text-white p-20 text-center font-black text-4xl">RENDER SUCCESSFUL</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
