"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Suspense } from "react";
import { FullPageSpinner } from "@/components/shared/loading-spinner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { GlobalInsights } from "@/components/dashboard/global-insights";
import { RealtimeFeed } from "@/components/dashboard/realtime-feed";
import { TrendAnalysis } from "@/components/dashboard/trend-analysis";
import { RegionalHeatmap } from "@/components/dashboard/regional-heatmap";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "regions", label: "Regions" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <ErrorBoundary>
        <Suspense fallback={<FullPageSpinner size="lg" />}>

          {/* Tab Navigation */}
          <div className="flex justify-center space-x-6 border-b border-gray-700 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 text-sm font-medium transition-all rounded-lg ${
                  activeTab === tab.id ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeTab === "overview" && (
              <section className="space-y-6">
                {/* Stats Overview */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-semibold mb-2">Dashboard Overview</h2>
                  <p className="text-gray-400 mb-4">A snapshot of key metrics and performance indicators.</p>
                  <StatsGrid />
                </motion.div>

                {/* Global Insights */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-semibold mb-2">Global Insights</h2>
                  <p className="text-gray-400 mb-4">Explore real-time trends and emotional patterns across regions.</p>
                  <GlobalInsights />
                </motion.div>

                {/* Live Realtime Feed */}
                <motion.div
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-semibold mb-2">Realtime Feed</h2>
                  <p className="text-gray-400 mb-4">View live check-ins and updates as they occur.</p>
                  <RealtimeFeed />
                </motion.div>
              </section>
            )}

            {activeTab === "trends" && (
              <motion.div
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-2xl font-semibold mb-2">Trend Analysis</h2>
                <p className="text-gray-400 mb-4">Track emotional patterns and sentiment fluctuations over time.</p>
                <TrendAnalysis />
              </motion.div>
            )}

            {activeTab === "regions" && (
              <motion.div
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-2xl font-semibold mb-2">Regional Heatmap</h2>
                <p className="text-gray-400 mb-4">A geographic view of real-time emotional trends.</p>
                <RegionalHeatmap />
              </motion.div>
            )}
          </motion.div>
        </Suspense>
      </ErrorBoundary>
    </motion.div>
  );
}
