// src/components/analytics/mood-distribution.tsx
"use client";

import { memo, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import { EMOTION_COLORS } from "@/config/constants";
import type { EmotionData } from "@/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {name} ({`${(percent * 100).toFixed(0)}%`})
    </text>
  );
};

export const MoodDistribution = memo(function MoodDistribution({
  data,
  isLoading,
  timeframe = "24h",
  onTimeframeChange,
}: {
  data: EmotionData[];
  isLoading?: boolean;
  timeframe?: "24h" | "7d" | "30d";
  onTimeframeChange?: (timeframe: string) => void;
}) {
  const { theme } = useTheme();
  const { trackEvent } = useAnalytics();

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.emotion,
        value: item.count,
        // Cast item.emotion as a key of EMOTION_COLORS, with a fallback color if not found.
        color:
          EMOTION_COLORS[item.emotion as keyof typeof EMOTION_COLORS] || "#000000",
      })),
    [data]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Count: {data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Global Mood Distribution</h3>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((tf) => (
            <button
              key={tf}
              onClick={() => {
                onTimeframeChange?.(tf);
                trackEvent("timeframe_changed", { timeframe: tf });
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                timeframe === tf
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <LoadingSpinner />
            </motion.div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="stroke-white dark:stroke-gray-800 stroke-2"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
});
