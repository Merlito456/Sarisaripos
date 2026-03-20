import { create } from 'zustand';
import { reportDB } from '../database/report.db';
import { 
  SalesData, 
  ProductPerformance, 
  CategoryPerformance,
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  YearlyReport,
  ProfitAnalysis,
  UtangAging,
  InventoryReport,
  ReportFilter
} from '../types/reports';

interface ReportState {
  // Data states
  salesData: SalesData[];
  topProducts: ProductPerformance[];
  categoryPerformance: CategoryPerformance[];
  dailyReport: DailyReport | null;
  weeklyReport: WeeklyReport | null;
  monthlyReport: MonthlyReport | null;
  yearlyReport: YearlyReport | null;
  profitAnalysis: ProfitAnalysis | null;
  utangAging: UtangAging | null;
  inventoryReport: InventoryReport | null;
  
  // UI states
  loadingCount: number;
  error: string | null;
  currentFilter: ReportFilter;
  
  // Computed
  isLoading: boolean;
  
  // Actions
  loadSalesData: (startDate: Date, endDate: Date) => Promise<void>;
  loadTopProducts: (startDate: Date, endDate: Date, limit?: number) => Promise<void>;
  loadCategoryPerformance: (startDate: Date, endDate: Date) => Promise<void>;
  loadDailyReport: (date: Date) => Promise<void>;
  loadWeeklyReport: (year: number, week: number) => Promise<void>;
  loadMonthlyReport: (year: number, month: number) => Promise<void>;
  loadYearlyReport: (year: number) => Promise<void>;
  loadProfitAnalysis: (startDate: Date, endDate: Date) => Promise<void>;
  loadUtangAging: () => Promise<void>;
  loadInventoryReport: () => Promise<void>;
  setFilter: (filter: Partial<ReportFilter>) => void;
  exportReport: (format: 'csv' | 'pdf', data: any) => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  salesData: [],
  topProducts: [],
  categoryPerformance: [],
  dailyReport: null,
  weeklyReport: null,
  monthlyReport: null,
  yearlyReport: null,
  profitAnalysis: null,
  utangAging: null,
  inventoryReport: null,
  loadingCount: 0,
  get isLoading() { return get().loadingCount > 0; },
  error: null,
  currentFilter: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    endDate: new Date()
  },
  
  loadSalesData: async (startDate, endDate) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getSalesData(startDate, endDate);
      set(state => ({ 
        salesData: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load sales data', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadTopProducts: async (startDate, endDate, limit = 10) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getTopProducts(startDate, endDate, limit);
      set(state => ({ 
        topProducts: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load top products', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadCategoryPerformance: async (startDate, endDate) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getCategoryPerformance(startDate, endDate);
      set(state => ({ 
        categoryPerformance: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load category performance', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadDailyReport: async (date) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getDailyReport(date);
      set(state => ({ 
        dailyReport: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load daily report', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadWeeklyReport: async (year, week) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getWeeklyReport(year, week);
      set(state => ({ 
        weeklyReport: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load weekly report', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadMonthlyReport: async (year, month) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getMonthlyReport(year, month);
      set(state => ({ 
        monthlyReport: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load monthly report', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadYearlyReport: async (year) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getYearlyReport(year);
      set(state => ({ 
        yearlyReport: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load yearly report', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadProfitAnalysis: async (startDate, endDate) => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getProfitAnalysis(startDate, endDate);
      set(state => ({ 
        profitAnalysis: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load profit analysis', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadUtangAging: async () => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getUtangAging();
      set(state => ({ 
        utangAging: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load utang aging', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  loadInventoryReport: async () => {
    set(state => ({ loadingCount: state.loadingCount + 1, error: null }));
    try {
      const data = await reportDB.getInventoryReport();
      set(state => ({ 
        inventoryReport: data, 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    } catch (error) {
      set(state => ({ 
        error: 'Failed to load inventory report', 
        loadingCount: Math.max(0, state.loadingCount - 1) 
      }));
    }
  },
  
  setFilter: (filter) => {
    set(state => ({
      currentFilter: { ...state.currentFilter, ...filter }
    }));
  },
  
  exportReport: (format, data) => {
    // Implementation for CSV/PDF export
    console.log(`Exporting as ${format}:`, data);
  }
}));
