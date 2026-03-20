import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useReports } from '../../hooks/useReports';

export const TopProductsChart: React.FC = () => {
  const { topProducts, formatCurrency } = useReports();
  
  const data = topProducts.slice(0, 10).map(p => ({
    name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
    sales: p.totalRevenue,
    profit: p.totalProfit
  }));
  
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
    return `₱${value}`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-2xl border border-stone-100">
          <p className="font-black text-stone-900 mb-2">{label}</p>
          <p className="text-sm font-bold text-indigo-600">
            Sales: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm font-bold text-emerald-600">
              Profit: {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={100} 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
          <Bar dataKey="sales" fill="#4f46e5" name="Total Sales" radius={[0, 4, 4, 0]} barSize={20} />
          <Bar dataKey="profit" fill="#10b981" name="Total Profit" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
