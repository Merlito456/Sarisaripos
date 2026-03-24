import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  Download,
  RefreshCw
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { DateRangePicker } from '../components/reports/DateRangePicker';
import { SalesChart } from '../components/reports/SalesChart';
import { TopProductsChart } from '../components/reports/TopProductsChart';
import { SalesSummary } from '../components/reports/SalesSummary';
import { ProfitMarginCard } from '../components/reports/ProfitMarginCard';
import { UtangAgingReport } from '../components/reports/UtangAgingReport';
import { InventoryReport } from '../components/reports/InventoryReport';

export const Reports: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isLoading, 
    exportCurrentReport,
    loadReports
  } = useReports();
  
  const tabs = [
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'utang', label: 'Utang', icon: Users },
    { id: 'profit', label: 'Profit', icon: DollarSign }
  ];
  
  return (
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 bg-stone-50 min-h-full">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight uppercase leading-none">Reports</h1>
          <p className="text-stone-500 font-medium text-sm lg:text-base">Analyze your business performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <DateRangePicker />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadReports()}
              className="p-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all shadow-sm active:bg-stone-100"
              title="Refresh"
            >
              <RefreshCw size={20} className="text-stone-600" />
            </button>
            <button
              onClick={() => exportCurrentReport('csv')}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-100 font-black uppercase tracking-widest active:bg-emerald-700"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-sm p-2 border border-stone-200 flex space-x-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[80px] sm:min-w-0 flex items-center justify-center space-x-2 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:bg-stone-50 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'
            }`}
          >
            <tab.icon size={20} />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-stone-200 border-dashed">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-stone-500 font-bold">Loading report data...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'sales' && (
            <>
              <SalesSummary />
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
                <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Sales Trend</h3>
                <SalesChart type="line" dataKey="totalSales" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
                  <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Top Products</h3>
                  <TopProductsChart />
                </div>
                <div className="bg-white rounded-3xl shadow-sm p-8 border border-stone-200">
                  <h3 className="text-xl font-black text-stone-900 tracking-tight uppercase mb-8">Category Distribution</h3>
                  <SalesChart type="pie" />
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'inventory' && (
            <InventoryReport />
          )}
          
          {activeTab === 'utang' && (
            <UtangAgingReport />
          )}
          
          {activeTab === 'profit' && (
            <ProfitMarginCard />
          )}
        </div>
      )}
      
      {/* Bottom Spacer for Mobile Nav */}
      <div className="h-24 lg:hidden" />
    </div>
  );
};
