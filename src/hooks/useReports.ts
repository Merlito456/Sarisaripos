import { useEffect, useState } from 'react';
import { useReportStore } from '../store/useReportStore';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export const useReports = () => {
  const store = useReportStore();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'utang' | 'profit'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  
  const { currentFilter } = store;
  
  useEffect(() => {
    loadReports();
  }, [currentFilter.startDate, currentFilter.endDate, activeTab]);
  
  const loadReports = async () => {
    if (!currentFilter.startDate || !currentFilter.endDate) return;
    
    try {
      switch(activeTab) {
        case 'sales':
          await Promise.all([
            store.loadSalesData(currentFilter.startDate, currentFilter.endDate),
            store.loadTopProducts(currentFilter.startDate, currentFilter.endDate),
            store.loadCategoryPerformance(currentFilter.startDate, currentFilter.endDate)
          ]);
          break;
        case 'inventory':
          await store.loadInventoryReport();
          break;
        case 'utang':
          await store.loadUtangAging();
          break;
        case 'profit':
          await store.loadProfitAnalysis(currentFilter.startDate, currentFilter.endDate);
          break;
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    }
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fil-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };
  
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  const getDateRangeText = (): string => {
    if (!currentFilter.startDate || !currentFilter.endDate) return 'No date range selected';
    
    const start = format(currentFilter.startDate, 'MMM dd, yyyy');
    const end = format(currentFilter.endDate, 'MMM dd, yyyy');
    
    if (dateRange === 'today') return 'Today';
    if (dateRange === 'week') return 'This Week';
    if (dateRange === 'month') return 'This Month';
    if (dateRange === 'year') return 'This Year';
    
    return `${start} - ${end}`;
  };
  
  const exportCurrentReport = async (format: 'csv' | 'pdf') => {
    let data: any;
    
    switch(activeTab) {
      case 'sales':
        data = store.salesData;
        break;
      case 'inventory':
        data = store.inventoryReport;
        break;
      case 'utang':
        data = store.utangAging;
        break;
      case 'profit':
        data = store.profitAnalysis;
        break;
    }
    
    await store.exportReport(format, data);
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };
  
  return {
    ...store,
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    formatCurrency,
    formatPercentage,
    getDateRangeText,
    exportCurrentReport,
    loadReports
  };
};
