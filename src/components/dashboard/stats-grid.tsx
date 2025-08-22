// src/components/dashboard/stats-grid.tsx
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { fetchDashboardStats } from "@/lib/api";
import { Users, TrendingUp, Globe, Clock, Activity } from "lucide-react";

// Helper mappings for color classes.
const bgColorMap: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  yellow: "bg-yellow-600",
  purple: "bg-purple-600",
};

const textColorMap: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  purple: "text-purple-400",
};

// Minimal stat card component.
function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  change: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="p-4 bg-gray-900 bg-opacity-40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${bgColorMap[color]} bg-opacity-20`}
        >
          <Icon className={textColorMap[color]} />
        </div>
      </div>
      <p
        className={`text-sm mt-2 ${
          change >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {change >= 0 ? `+${change}%` : `${change}%`}
      </p>
    </Card>
  );
}

export const StatsGrid = memo(function StatsGrid() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-400">
        Loading stats...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load statistics.
      </div>
    );
  }

  const stats = [
    {
      label: "Active Users",
      value: data?.activeUsers ?? 0,
      change: data?.userChange ?? 0,
      icon: Users,
      color: "blue",
    },
    {
      label: "Global Check-Ins",
      value: data?.globalCheckIns ?? 0,
      change: data?.checkInChange ?? 0,
      icon: Globe,
      color: "green",
    },
    {
      label: "Avg Response Time",
      value: data?.avgResponse ?? 0,
      change: data?.responseChange ?? 0,
      icon: Clock,
      color: "yellow",
    },
    {
      label: "Engagement Rate",
      value: data?.engagement ?? 0,
      change: data?.engagementChange ?? 0,
      icon: Activity,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
});
