import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useReports } from '../../hooks/useReports';

export const DateRangePicker: React.FC = () => {
  const { currentFilter, setFilter, dateRange, setDateRange } = useReports();
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePreset = (range: 'today' | 'week' | 'month' | 'year') => {
    setDateRange(range);
    const now = new Date();
    let startDate = new Date();
    
    switch(range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    setFilter({ startDate, endDate: new Date() });
    setIsOpen(false);
  };
  
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom', value: 'custom' }
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-5 py-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all shadow-sm active:bg-stone-100"
      >
        <Calendar size={18} className="text-indigo-600" />
        <span className="text-sm font-black text-stone-900 uppercase tracking-tight">
          {currentFilter.startDate && currentFilter.endDate ? (
            `${currentFilter.startDate.toLocaleDateString()} - ${currentFilter.endDate.toLocaleDateString()}`
          ) : (
            'Select Date Range'
          )}
        </span>
        <ChevronDown size={16} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-3xl shadow-2xl border border-stone-100 z-50 w-64 overflow-hidden">
          <div className="p-3">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePreset(preset.value as any)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  dateRange === preset.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
