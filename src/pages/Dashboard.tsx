import React, { useEffect, useState } from 'react';
import { db, type Transaction, type Product } from '../database/db';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  PhilippinePeso
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await db.transactions
        .where('timestamp')
        .above(today)
        .toArray();

      const sales = todayTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
      const customers = await db.customers.count();
      const products = await db.products.toArray();
      const lowStock = products.filter(p => p.stock <= p.minStock).length;

      setStats({
        todaySales: sales,
        totalCustomers: customers,
        lowStockItems: lowStock,
        totalProducts: products.length,
      });

      const recent = await db.transactions
        .orderBy('timestamp')
        .reverse()
        .limit(5)
        .toArray();
      setRecentTransactions(recent);

      // Simple mock chart data for the last 7 days
      const mockChart = [
        { name: 'Mon', sales: 1200 },
        { name: 'Tue', sales: 1900 },
        { name: 'Wed', sales: 1500 },
        { name: 'Thu', sales: 2100 },
        { name: 'Fri', sales: 2800 },
        { name: 'Sat', sales: 3500 },
        { name: 'Sun', sales: sales },
      ];
      setChartData(mockChart);
    };

    loadData();
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 bg-stone-50 min-h-full">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight uppercase leading-none">Tindahan Dashboard</h1>
          <p className="text-stone-500 font-medium text-sm lg:text-base">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="lg:text-right">
          <div className="text-[10px] lg:text-sm font-bold text-stone-400 uppercase tracking-widest">Current Date</div>
          <div className="text-lg lg:text-xl font-black text-indigo-600">{new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`₱${stats.todaySales.toLocaleString()}`} 
          icon={<PhilippinePeso className="text-emerald-600" />}
          trend="+12%"
          trendUp={true}
          color="bg-emerald-50"
        />
        <StatCard 
          title="Total Customers" 
          value={stats.totalCustomers.toString()} 
          icon={<Users className="text-indigo-600" />}
          trend="+3"
          trendUp={true}
          color="bg-indigo-50"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStockItems.toString()} 
          icon={<AlertTriangle className="text-amber-600" />}
          trend={stats.lowStockItems > 0 ? "Action needed" : "All good"}
          trendUp={false}
          color="bg-amber-50"
        />
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts.toString()} 
          icon={<Package className="text-stone-600" />}
          trend="In inventory"
          trendUp={true}
          color="bg-stone-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-stone-800 uppercase tracking-tight">Weekly Sales Performance</h2>
            <select className="bg-stone-100 border-none rounded-lg text-sm font-bold px-3 py-1">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12, fontWeight: 600}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  itemStyle={{fontWeight: 'bold', color: '#4f46e5'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-black text-stone-800 uppercase tracking-tight mb-6">Recent Sales</h2>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-stone-400 text-center py-8">No transactions yet</p>
            ) : (
              recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-2xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${t.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      <PhilippinePeso size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-stone-800">Sale #{t.id?.toString().slice(-4)}</div>
                      <div className="text-xs text-stone-400 font-medium">{t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-stone-900">₱{t.finalAmount.toFixed(2)}</div>
                    <div className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{t.paymentMethod}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl transition-colors">
            View All Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, color }: any) {
  return (
    <div className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-stone-200 bg-white group hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-2 lg:mb-4">
        <div className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { size: window.innerWidth < 1024 ? 18 : 24 })}
        </div>
        <div className={`flex items-center text-[10px] lg:text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span className="ml-0.5 lg:ml-1">{trend}</span>
        </div>
      </div>
      <div className="text-[10px] lg:text-sm font-bold text-stone-400 uppercase tracking-widest mb-0.5 lg:mb-1">{title}</div>
      <div className="text-xl lg:text-3xl font-black text-stone-900">{value}</div>
    </div>
  );
}
