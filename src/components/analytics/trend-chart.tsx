// src/components/analytics/trend-chart.tsx
"use client";

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from "next-themes";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Card } from "@/components/ui/card";
import type { TrendData } from "@/types";

interface TrendChartProps {
  data: TrendData[];
  isLoading?: boolean;
  error?: Error;
  height?: number;
}

export const TrendChart = memo(function TrendChart({
  data,
  isLoading,
  error,
  height = 300
}: TrendChartProps) {
  const { theme = 'light' } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry: any) => (
            <div 
              key={entry.name}
              className="flex items-center gap-2 text-sm"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {entry.name}:
              </span>
              <span className="text-gray-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <LoadingSpinner />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <p className="text-red-500">Error loading chart data</p>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: isMobile ? 10 : 30,
              bottom: isMobile ? 50 : 60,
              left: isMobile ? 10 : 30,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            />
            <XAxis
              dataKey="x"
              tick={{ 
                fill: theme === 'dark' ? '#999' : '#666',
                fontSize: 12 
              }}
              tickLine={{ stroke: theme === 'dark' ? '#666' : '#ccc' }}
              axisLine={{ stroke: theme === 'dark' ? '#666' : '#ccc' }}
              tickMargin={8}
              tickCount={isMobile ? 5 : undefined}
            />
            <YAxis
              tick={{ 
                fill: theme === 'dark' ? '#999' : '#666',
                fontSize: 12 
              }}
              tickLine={{ stroke: theme === 'dark' ? '#666' : '#ccc' }}
              axisLine={{ stroke: theme === 'dark' ? '#666' : '#ccc' }}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {value}
                </span>
              )}
            />
            {data.map((series) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey="y"
                data={series.data}
                name={series.id}
                stroke={series.color}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: series.color,
                  strokeWidth: 2,
                  stroke: theme === 'dark' ? '#1a1a1a' : '#ffffff'
                }}
                activeDot={{
                  r: 6,
                  stroke: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  strokeWidth: 2
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});