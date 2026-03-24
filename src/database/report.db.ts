import { db } from './db';
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
  InventoryReport
} from '../types/reports';

export class ReportDatabase {
  
  // Get sales data for date range
  async getSalesData(startDate: Date, endDate: Date): Promise<SalesData[]> {
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();

    if (transactions.length === 0) return [];

    const salesByDate = new Map<string, SalesData>();
    const transactionIds = transactions.map(t => t.id).filter((id): id is string => !!id);
    
    // Fetch all items for these transactions in one go
    const allItems = await db.transactionItems
      .where('transactionId')
      .anyOf(transactionIds)
      .toArray();

    // Fetch all products involved in one go
    const productIds = Array.from(new Set(allItems.map(item => item.productId)));
    const products = await db.products.where('id').anyOf(productIds).toArray();
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Group items by transaction
    const itemsByTx = new Map<string, any[]>();
    for (const item of allItems) {
      if (!itemsByTx.has(item.transactionId)) {
        itemsByTx.set(item.transactionId, []);
      }
      itemsByTx.get(item.transactionId)!.push(item);
    }

    for (const transaction of transactions) {
      const dateKey = transaction.timestamp.toISOString().split('T')[0];
      
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, {
          date: dateKey,
          totalSales: 0,
          totalProfit: 0,
          transactionCount: 0,
          averageTicket: 0,
          cashSales: 0,
          creditSales: 0,
          digitalSales: 0
        });
      }
      
      const data = salesByDate.get(dateKey)!;
      data.totalSales += transaction.finalAmount;
      data.transactionCount++;
      
      // Categorize by payment method
      switch(transaction.paymentMethod) {
        case 'cash':
          data.cashSales += transaction.finalAmount;
          break;
        case 'credit':
          data.creditSales += transaction.finalAmount;
          break;
        case 'gcash':
        case 'maya':
        case 'bank_transfer':
          data.digitalSales += transaction.finalAmount;
          break;
      }
      
      // Calculate profit using pre-fetched items and products
      const items = itemsByTx.get(transaction.id!) || [];
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (product) {
          data.totalProfit += (item.unitPrice - product.cost) * item.quantity;
        }
      }
    }
    
    // Calculate average ticket
    salesByDate.forEach(data => {
      data.averageTicket = data.transactionCount > 0 ? data.totalSales / data.transactionCount : 0;
    });
    
    return Array.from(salesByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Get top performing products
  async getTopProducts(
    startDate: Date, 
    endDate: Date, 
    limit: number = 10
  ): Promise<ProductPerformance[]> {
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();
    
    const transactionIds = transactions.map(t => t.id);
    
    const transactionItems = await db.transactionItems
      .where('transactionId')
      .anyOf(transactionIds)
      .toArray();
    
    const productStats = new Map<string, ProductPerformance>();
    
    for (const item of transactionItems) {
      const product = await db.products.get(item.productId);
      if (!product) continue;
      
      if (!productStats.has(product.id)) {
        productStats.set(product.id, {
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0,
          stockLeft: product.stock,
          turnoverRate: 0
        });
      }
      
      const stats = productStats.get(product.id)!;
      stats.quantitySold += item.quantity;
      stats.totalRevenue += item.subtotal;
      stats.totalCost += (product.cost * item.quantity);
      stats.totalProfit = stats.totalRevenue - stats.totalCost;
      stats.profitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;
    }
    
    return Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }
  
  // Get category performance
  async getCategoryPerformance(
    startDate: Date, 
    endDate: Date
  ): Promise<CategoryPerformance[]> {
    const topProducts = await this.getTopProducts(startDate, endDate, 1000);
    const totalSales = topProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    
    const categoryMap = new Map<string, CategoryPerformance>();
    
    topProducts.forEach(product => {
      if (!categoryMap.has(product.category)) {
        categoryMap.set(product.category, {
          category: product.category,
          totalSales: 0,
          totalProfit: 0,
          percentageOfTotal: 0,
          itemsSold: 0
        });
      }
      
      const cat = categoryMap.get(product.category)!;
      cat.totalSales += product.totalRevenue;
      cat.totalProfit += product.totalProfit;
      cat.itemsSold += product.quantitySold;
    });
    
    // Calculate percentages
    categoryMap.forEach(cat => {
      cat.percentageOfTotal = totalSales > 0 ? (cat.totalSales / totalSales) * 100 : 0;
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalSales - a.totalSales);
  }
  
  // Get daily report
  async getDailyReport(date: Date): Promise<DailyReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const transactions = await db.transactions
      .where('timestamp')
      .between(startOfDay, endOfDay)
      .toArray();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalProfit = await this.calculateProfitForTransactions(transactions);
    
    // Find top product
    const topProducts = await this.getTopProducts(startOfDay, endOfDay, 1);
    const topProduct = topProducts[0]?.productName || 'None';
    
    // Find best hour
    const hourSales = new Array(24).fill(0);
    transactions.forEach(t => {
      const hour = t.timestamp.getHours();
      hourSales[hour] += t.finalAmount;
    });
    const bestHour = hourSales.indexOf(Math.max(...hourSales));
    
    return {
      date: date.toISOString().split('T')[0],
      sales: totalSales,
      profit: totalProfit,
      transactions: transactions.length,
      topProduct,
      bestHour
    };
  }
  
  // Get weekly report
  async getWeeklyReport(year: number, week: number): Promise<WeeklyReport> {
    const startDate = this.getStartOfWeek(year, week);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalProfit = await this.calculateProfitForTransactions(transactions);
    
    return {
      week,
      month: startDate.getMonth() + 1,
      year,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalSales,
      totalProfit,
      transactionCount: transactions.length,
      averageDailySales: totalSales / 7
    };
  }
  
  // Get monthly report
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalProfit = await this.calculateProfitForTransactions(transactions);
    const topProducts = await this.getTopProducts(startDate, endDate, 1);
    const topCategories = await this.getCategoryPerformance(startDate, endDate);
    
    // Calculate growth compared to previous month
    const prevMonthDate = new Date(year, month - 2, 1);
    const prevMonthTransactions = await db.transactions
      .where('timestamp')
      .between(prevMonthDate, startDate)
      .toArray();
    const prevMonthSales = prevMonthTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const salesGrowth = prevMonthSales ? ((totalSales - prevMonthSales) / prevMonthSales) * 100 : 0;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    return {
      month,
      monthName: monthNames[month - 1],
      year,
      totalSales,
      totalProfit,
      transactionCount: transactions.length,
      topSellingProduct: topProducts[0]?.productName || 'None',
      topSellingCategory: topCategories[0]?.category || 'None',
      salesGrowth
    };
  }
  
  // Get yearly report
  async getYearlyReport(year: number): Promise<YearlyReport> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();
    
    const totalSales = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const totalProfit = await this.calculateProfitForTransactions(transactions);
    
    // Get monthly breakdown to find best/worst month
    const monthlyReports = [];
    for (let i = 1; i <= 12; i++) {
      const report = await this.getMonthlyReport(year, i);
      monthlyReports.push(report);
    }
    
    const bestMonth = monthlyReports.reduce((best, current) => 
      current.totalSales > best.totalSales ? current : best
    );
    
    const worstMonth = monthlyReports.reduce((worst, current) => 
      current.totalSales < worst.totalSales ? current : worst
    );
    
    // Calculate growth compared to previous year
    const prevYearStart = new Date(year - 1, 0, 1);
    const prevYearEnd = new Date(year - 1, 11, 31);
    const prevYearTransactions = await db.transactions
      .where('timestamp')
      .between(prevYearStart, prevYearEnd)
      .toArray();
    const prevYearSales = prevYearTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const growthRate = prevYearSales ? ((totalSales - prevYearSales) / prevYearSales) * 100 : 0;
    
    return {
      year,
      totalSales,
      totalProfit,
      totalTransactions: transactions.length,
      bestMonth: bestMonth.monthName,
      worstMonth: worstMonth.monthName,
      averageMonthlySales: totalSales / 12,
      growthRate
    };
  }
  
  // Get profit analysis
  async getProfitAnalysis(startDate: Date, endDate: Date): Promise<ProfitAnalysis> {
    const transactions = await db.transactions
      .where('timestamp')
      .between(startDate, endDate)
      .toArray();
    
    const grossRevenue = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
    const grossProfit = await this.calculateProfitForTransactions(transactions);
    const totalCost = grossRevenue - grossProfit;
    const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    
    // No simulated expenses as per user request for actual data only
    const expenses: { category: string; amount: number }[] = [];
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    
    return {
      grossRevenue,
      totalCost,
      grossProfit,
      profitMargin,
      expenses,
      netProfit
    };
  }
  
  // Get utang aging report
  async getUtangAging(): Promise<UtangAging> {
    const customers = await db.customers
      .where('currentBalance')
      .above(0)
      .toArray();
    
    const now = new Date();
    const aging = {
      current: 0,
      aging31to60: 0,
      aging61to90: 0,
      aging91plus: 0,
      totalReceivables: 0,
      customersWithUtang: customers.length,
      highestBalance: { customerName: '', balance: 0 }
    };
    
    for (const customer of customers) {
      aging.totalReceivables += customer.currentBalance;
      
      if (customer.currentBalance > aging.highestBalance.balance) {
        aging.highestBalance = {
          customerName: `${customer.firstName} ${customer.lastName}`,
          balance: customer.currentBalance
        };
      }
      
      // Get last transaction to determine aging
      const lastTransaction = await db.transactions
        .where('customerId')
        .equals(customer.id)
        .reverse()
        .first();
      
      if (lastTransaction) {
        const daysSincePurchase = Math.floor((now.getTime() - lastTransaction.timestamp.getTime()) / (1000 * 3600 * 24));
        
        if (daysSincePurchase <= 30) {
          aging.current += customer.currentBalance;
        } else if (daysSincePurchase <= 60) {
          aging.aging31to60 += customer.currentBalance;
        } else if (daysSincePurchase <= 90) {
          aging.aging61to90 += customer.currentBalance;
        } else {
          aging.aging91plus += customer.currentBalance;
        }
      } else {
        aging.current += customer.currentBalance;
      }
    }
    
    return aging;
  }
  
  // Get inventory report
  async getInventoryReport(): Promise<InventoryReport> {
    const products = await db.products.toArray();
    
    const totalValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
    const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);
    
    // Fetch all transaction items once to calculate turnover/slow moving
    const allTransactionItems = await db.transactionItems.toArray();
    const productSalesMap = new Map<string, number>();
    for (const item of allTransactionItems) {
      productSalesMap.set(item.productId, (productSalesMap.get(item.productId) || 0) + item.quantity);
    }

    // Find slow moving items
    const slowMovingItems = [];
    for (const product of products) {
      const totalSold = productSalesMap.get(product.id!) || 0;
      const daysInStock = product.createdAt ? 
        Math.floor((Date.now() - product.createdAt.getTime()) / (1000 * 3600 * 24)) : 90;
      
      if (totalSold === 0 && daysInStock > 30) {
        slowMovingItems.push({
          productName: product.name,
          daysInStock,
          quantitySold: totalSold
        });
      }
    }
    
    // Categorize by category
    const categoriesMap = new Map();
    products.forEach(product => {
      if (!categoriesMap.has(product.category)) {
        categoriesMap.set(product.category, {
          category: product.category,
          totalValue: 0,
          itemCount: 0
        });
      }
      const cat = categoriesMap.get(product.category);
      cat.totalValue += product.cost * product.stock;
      cat.itemCount++;
    });
    
    const categories = Array.from(categoriesMap.values());
    
    return {
      totalProducts: products.length,
      totalValue,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      expiringItems: 0, // Would need expiry dates in products
      slowMovingItems: slowMovingItems.slice(0, 10),
      categories
    };
  }
  
  // Helper: Calculate profit for transactions
  private async calculateProfitForTransactions(transactions: any[]): Promise<number> {
    const transactionIds = transactions.map(t => t.id).filter((id): id is string => !!id);
    if (transactionIds.length === 0) return 0;

    const items = await db.transactionItems
      .where('transactionId')
      .anyOf(transactionIds)
      .toArray();
    
    if (items.length === 0) return 0;

    // Fetch all products involved in one go
    const productIds = Array.from(new Set(items.map(item => item.productId)));
    const products = await db.products.where('id').anyOf(productIds).toArray();
    const productMap = new Map(products.map(p => [p.id, p]));

    let totalProfit = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product) {
        totalProfit += (item.unitPrice - product.cost) * item.quantity;
      }
    }
    
    return totalProfit;
  }
  
  // Helper: Get start of week
  private getStartOfWeek(year: number, week: number): Date {
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
}

export const reportDB = new ReportDatabase();
