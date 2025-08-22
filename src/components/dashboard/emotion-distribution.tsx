// src/components/dashboard/emotion-distribution.tsx
"use client";

import React, { memo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";
import type { EmotionDistributionData } from "@/types";

interface EmotionDistributionProps {
  /**
   * The emotion distribution data in the format required by ResponsivePie.
   * Each slice should have an id, label, value, and color.
   */
  data?: EmotionDistributionData[];
}

export const EmotionDistribution = memo(function EmotionDistribution({
  data = [],
}: EmotionDistributionProps) {
  const { theme } = useTheme();

  // Show an elegant empty state when no data is available.
  if (data.length === 0) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium mb-2">Emotion Distribution</h3>
        <p className="text-sm text-gray-400 mb-6">
          No distribution data yet. Once people check in, you’ll see a colorful breakdown of the world’s feelings here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-medium">Emotion Distribution</h3>
        <p className="text-sm text-gray-400 mb-6">Global emotional breakdown</p>
      </motion.div>

      <div className="h-[300px]">
        <ResponsivePie
          data={data}
          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          innerRadius={0.6}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={{ scheme: "category10" }}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          enableArcLinkLabels
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={theme === "dark" ? "#fff" : "#333"}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          legends={[
            {
              anchor: "right",
              direction: "column",
              justify: false,
              translateX: 0,
              translateY: 0,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 20,
              itemTextColor: theme === "dark" ? "#fff" : "#333",
              itemDirection: "left-to-right",
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: "circle",
            },
          ]}
        />
      </div>
    </Card>
  );
});
