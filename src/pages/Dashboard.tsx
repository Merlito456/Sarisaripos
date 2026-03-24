import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, Package, Users, TrendingUp, Cloud, Crown, Database, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, userPlan, isPremium } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    console.log("Dashboard Mounted");
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stats = [
    { label: 'Products', value: '0', icon: Package, color: 'bg-blue-500' },
    { label: 'Customers', value: '0', icon: Users, color: 'bg-green-500' },
    { label: 'Today\'s Sales', value: '₱0', icon: TrendingUp, color: 'bg-yellow-500' },
    { label: 'Utang', value: '₱0', icon: Store, color: 'bg-red-500' },
  ];

  const quickActions = [
    { title: 'New Sale', path: '/pos', icon: '🛒', color: 'bg-blue-500' },
    { title: 'Add Product', path: '/inventory', icon: '📦', color: 'bg-green-500' },
    { title: 'Add Customer', path: '/customers', icon: '👤', color: 'bg-purple-500' },
    { title: 'Reports', path: '/reports', icon: '📊', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Welcome back, <span className="text-indigo-600">{user?.user_metadata?.first_name || 'Store Owner'}</span>!
            </h1>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {/* Plan Pill */}
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isPremium 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {isPremium ? <Crown size={12} /> : <Database size={12} />}
                <span>{isPremium ? userPlan : 'Free Plan'}</span>
              </div>

              {/* Storage Pill */}
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isPremium 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {isPremium ? <Cloud size={12} /> : <Database size={12} />}
                <span>{isPremium ? 'Cloud Sync' : 'Local Only'}</span>
              </div>

              {/* Online Pill */}
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                <Wifi size={12} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {!isPremium && (
                <Link 
                  to="/premium" 
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
                >
                  <Crown size={12} />
                  <span>Upgrade</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center self-start md:self-center">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 flex items-center space-x-3 shadow-sm">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Account</p>
                <p className="text-xs font-bold text-gray-700 leading-none truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} p-2.5 rounded-xl shadow-lg shadow-gray-100`}>
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className={`${action.color} text-white rounded-2xl p-6 text-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-gray-100`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <span className="text-xs font-black uppercase tracking-widest">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Premium Banner for Free Users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Crown size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <Crown size={20} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-widest text-blue-100">Premium Feature</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Unlock Cloud Sync & Unlimited Items</h3>
              <p className="text-blue-100 opacity-90 mb-6 max-w-md font-medium">
                Never lose your data. Sync across all your devices and manage thousands of products with our Pro plans.
              </p>
              <Link
                to="/premium"
                className="bg-white text-blue-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all inline-block shadow-lg"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No recent transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
