"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Smartphone, MapPin, TrendingUp, Calendar } from "lucide-react";

interface AnalyticsData {
  totalDevices: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  deviceGrowth: { date: string; count: number }[];
  topRegions: { region: string; count: number }[];
  retentionRate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export function UserAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sys-control/analytics");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        Error: {error}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Devices</span>
            <Smartphone className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{analytics.totalDevices.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Unique users</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Today</span>
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{analytics.activeToday.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            {analytics.totalDevices > 0 ? ((analytics.activeToday / analytics.totalDevices) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active This Week</span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{analytics.activeThisWeek.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            {analytics.totalDevices > 0 ? ((analytics.activeThisWeek / analytics.totalDevices) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active This Month</span>
            <TrendingUp className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-white">{analytics.activeThisMonth.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">
            {analytics.totalDevices > 0 ? ((analytics.activeThisMonth / analytics.totalDevices) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>
      </div>

      {/* Retention Metrics */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Retention Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{analytics.retentionRate.daily.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">Daily Retention</div>
            <div className="text-xs text-gray-500 mt-1">Users returning daily</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{analytics.retentionRate.weekly.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">Weekly Retention</div>
            <div className="text-xs text-gray-500 mt-1">Users returning weekly</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{analytics.retentionRate.monthly.toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">Monthly Retention</div>
            <div className="text-xs text-gray-500 mt-1">Users returning monthly</div>
          </div>
        </div>
      </motion.div>

      {/* Device Growth Chart */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Device Growth (Last 30 Days)</h3>
        <div className="flex items-end justify-between gap-1 h-48">
          {analytics.deviceGrowth.slice(-30).map((day, index) => {
            const maxCount = Math.max(...analytics.deviceGrowth.map(d => d.count));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.6 + index * 0.02, duration: 0.3 }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {day.count}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top Regions */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Top Regions
        </h3>
        <div className="space-y-3">
          {analytics.topRegions.slice(0, 10).map((region, index) => {
            const maxCount = analytics.topRegions[0]?.count || 1;
            const percentage = (region.count / maxCount) * 100;

            return (
              <div key={region.region}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{region.region || "Unknown"}</span>
                  <span className="text-sm text-gray-400">{region.count.toLocaleString()} devices</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
