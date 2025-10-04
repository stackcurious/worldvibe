"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";

interface CheckInStatsData {
  total: number;
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  byEmotion: { emotion: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export function CheckInStats() {
  const [stats, setStats] = useState<CheckInStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sys-control/stats/check-ins");

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
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

  if (!stats) return null;

  const todayChange = stats.yesterday > 0
    ? ((stats.today - stats.yesterday) / stats.yesterday) * 100
    : 0;

  const weekChange = stats.lastWeek > 0
    ? ((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Check-ins</span>
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Today</span>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.today.toLocaleString()}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${todayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {todayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(todayChange).toFixed(1)}% vs yesterday
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">This Week</span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.thisWeek.toLocaleString()}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${weekChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weekChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(weekChange).toFixed(1)}% vs last week
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">This Month</span>
            <Calendar className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.thisMonth.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">{stats.lastMonth.toLocaleString()} last month</div>
        </motion.div>
      </div>

      {/* Emotion Distribution */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold mb-4">Emotion Distribution</h3>
        <div className="space-y-3">
          {stats.byEmotion.map((item, index) => {
            const percentage = (item.count / stats.total) * 100;
            return (
              <div key={item.emotion}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 capitalize">{item.emotion}</span>
                  <span className="text-sm text-gray-400">{item.count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Trend Chart (Simple Bar Chart) */}
      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Last 7 Days Trend</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {stats.dailyTrend.slice(-7).map((day, index) => {
            const maxCount = Math.max(...stats.dailyTrend.map(d => d.count));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {day.count}
                  </div>
                </motion.div>
                <span className="text-xs text-gray-400 text-center">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
