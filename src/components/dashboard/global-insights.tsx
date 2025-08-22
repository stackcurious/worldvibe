// src/components/dashboard/global-insights.tsx
"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchGlobalInsights } from "@/lib/api";
import { RegionalHeatmap } from "./regional-heatmap";
import { EmotionDistribution } from "./emotion-distribution";
import { TrendAnalysis } from "./trend-analysis";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import type {
  GlobalInsightsData,
  RegionalData,
  RegionalHeatmapData,
  EmotionDistributionData,
  TrendData
} from "@/types";

export const GlobalInsights = memo(function GlobalInsights() {
  // Use a union type for our tabs values.
  const [activeTab, setActiveTab] = useState<"heatmap" | "distribution" | "trends">("heatmap");

  // Using the updated types
  const { data, isLoading, isError } = useQuery<GlobalInsightsData>(
    ["global-insights"],
    fetchGlobalInsights,
    { refetchInterval: 30000 } // Refetch every 30 seconds in production.
  );

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-center text-red-500">
          An error occurred while fetching insights.
        </p>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="p-6 flex items-center justify-center py-20">
        <LoadingSpinner />
      </Card>
    );
  }

  // Extract global stats with fallbacks in case it's undefined.
  const {
    totalCheckIns = 0,
    activeCountries = 0,
    trendingEmotion = "N/A",
    averageIntensity = 0
  } = data.globalStats || {};

  // Transform RegionalData into RegionalHeatmapData required by the RegionalHeatmap component.
  const heatmapData: RegionalHeatmapData[] = data.regionalData.map((region: RegionalData) => ({
    id: region.regionCode,
    value: region.emotionalIndex,
  }));

  return (
    <Card className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold mb-1">Global Insights</h2>
        <p className="text-gray-400">
          Real‑time emotional patterns from across the globe
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Check-ins</p>
            <p className="text-xl font-semibold">{totalCheckIns.toLocaleString()}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Countries</p>
            <p className="text-xl font-semibold">{activeCountries}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Trending Emotion</p>
            <p className="text-xl font-semibold capitalize">{trendingEmotion}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Intensity</p>
            <p className="text-xl font-semibold">{averageIntensity.toFixed(1)}</p>
          </div>
        </div>
      </motion.div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "heatmap" | "distribution" | "trends")
        }
      >
        <TabsList>
          <TabsTrigger value="heatmap">Regional View</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <div className="h-[500px]">
            <RegionalHeatmap data={heatmapData} />
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="h-[400px]">
            <EmotionDistribution data={data.emotionDistribution} />
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="h-[400px]">
            <TrendAnalysis data={data.trends} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
});
