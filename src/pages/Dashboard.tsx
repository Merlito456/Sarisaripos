import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, Package, Users, TrendingUp, Cloud, Crown, Database, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, userPlan, isPremium } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back, {user?.user_metadata?.first_name || 'Store Owner'}!
            </h1>
            <div className="text-gray-600 text-sm mt-1">
              {isPremium ? (
                <span className="flex items-center space-x-1">
                  <Crown size={14} className="text-yellow-500" />
                  <span className="font-bold uppercase tracking-tight">{userPlan} Plan</span>
                  <span className="mx-1">•</span>
                  <Cloud size={14} className="text-blue-500" />
                  <span>Cloud sync active</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <Database size={14} className="text-gray-500" />
                  <span className="font-bold uppercase tracking-tight">Free Plan</span>
                  <span className="mx-1">•</span>
                  <span>Local storage only</span>
                  <Link to="/premium" className="text-blue-600 font-bold hover:underline ml-2">
                    Upgrade to Premium →
                  </Link>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-widest ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
              <Wifi size={14} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-bold text-gray-600 shadow-sm">
              {user?.email}
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
