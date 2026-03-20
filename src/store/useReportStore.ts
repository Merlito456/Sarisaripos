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
  isLoading: boolean;
  error: string | null;
  currentFilter: ReportFilter;
  
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
  isLoading: false,
  error: null,
  currentFilter: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    endDate: new Date()
  },
  
  loadSalesData: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getSalesData(startDate, endDate);
      set({ salesData: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load sales data', isLoading: false });
    }
  },
  
  loadTopProducts: async (startDate, endDate, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getTopProducts(startDate, endDate, limit);
      set({ topProducts: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load top products', isLoading: false });
    }
  },
  
  loadCategoryPerformance: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getCategoryPerformance(startDate, endDate);
      set({ categoryPerformance: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load category performance', isLoading: false });
    }
  },
  
  loadDailyReport: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getDailyReport(date);
      set({ dailyReport: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load daily report', isLoading: false });
    }
  },
  
  loadWeeklyReport: async (year, week) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getWeeklyReport(year, week);
      set({ weeklyReport: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load weekly report', isLoading: false });
    }
  },
  
  loadMonthlyReport: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getMonthlyReport(year, month);
      set({ monthlyReport: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load monthly report', isLoading: false });
    }
  },
  
  loadYearlyReport: async (year) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getYearlyReport(year);
      set({ yearlyReport: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load yearly report', isLoading: false });
    }
  },
  
  loadProfitAnalysis: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getProfitAnalysis(startDate, endDate);
      set({ profitAnalysis: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load profit analysis', isLoading: false });
    }
  },
  
  loadUtangAging: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getUtangAging();
      set({ utangAging: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load utang aging', isLoading: false });
    }
  },
  
  loadInventoryReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportDB.getInventoryReport();
      set({ inventoryReport: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load inventory report', isLoading: false });
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
