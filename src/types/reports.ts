export interface SalesData {
  date: string;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  averageTicket: number;
  cashSales: number;
  creditSales: number;
  digitalSales: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  stockLeft: number;
  turnoverRate: number;
}

export interface CategoryPerformance {
  category: string;
  totalSales: number;
  totalProfit: number;
  percentageOfTotal: number;
  itemsSold: number;
}

export interface DailyReport {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
  topProduct: string;
  bestHour: number;
}

export interface WeeklyReport {
  week: number;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  averageDailySales: number;
}

export interface MonthlyReport {
  month: number;
  monthName: string;
  year: number;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  topSellingProduct: string;
  topSellingCategory: string;
  salesGrowth: number; // percentage compared to previous month
}

export interface YearlyReport {
  year: number;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  bestMonth: string;
  worstMonth: string;
  averageMonthlySales: number;
  growthRate: number;
}

export interface ProfitAnalysis {
  grossRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  expenses: {
    category: string;
    amount: number;
  }[];
  netProfit: number;
}

export interface UtangAging {
  current: number; // 0-30 days
  aging31to60: number; // 31-60 days
  aging61to90: number; // 61-90 days
  aging91plus: number; // 90+ days
  totalReceivables: number;
  customersWithUtang: number;
  highestBalance: {
    customerName: string;
    balance: number;
  };
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  slowMovingItems: {
    productName: string;
    daysInStock: number;
    quantitySold: number;
  }[];
  categories: {
    category: string;
    totalValue: number;
    itemCount: number;
  }[];
}

export interface ReportFilter {
  startDate: Date | null;
  endDate: Date | null;
  category?: string;
  paymentMethod?: string;
  productId?: string;
  customerId?: string;
}
