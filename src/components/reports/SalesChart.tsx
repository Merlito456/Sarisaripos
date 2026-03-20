import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useReports } from '../../hooks/useReports';

interface SalesChartProps {
  type: 'line' | 'bar' | 'pie';
  dataKey?: string;
}

const COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#f97316'];

export const SalesChart: React.FC<SalesChartProps> = ({ type, dataKey = 'totalSales' }) => {
  const { salesData, categoryPerformance, formatCurrency } = useReports();
  
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
    return `₱${value}`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-2xl border border-stone-100">
          <p className="font-black text-stone-900 mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Add default empty data if none exists
  const chartData = salesData.length > 0 ? salesData : [{ date: 'No Data', totalSales: 0 }];
  const categoryData = categoryPerformance.length > 0 ? categoryPerformance : [{ name: 'No Data', totalSales: 0 }];
  
  if (type === 'pie') {
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="totalSales"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
          {type === 'line' ? (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#4f46e5"
              strokeWidth={4}
              dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="Sales"
            />
          ) : (
            <Bar dataKey={dataKey} fill="#4f46e5" name="Sales" radius={[4, 4, 0, 0]} />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};
