// @ts-nocheck
// src/components/dashboard/trend-analysis.tsx
"use client";

import { memo, useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useTimeframe, Timeframe } from "@/hooks/use-timeframe";
import { useAnalytics } from "@/hooks/use-analytics";
import { TrendData, DataPoint } from "@/types";
import { Loader2 } from "lucide-react";

interface TrendAnalysisProps {
  data?: TrendData[];
  height?: number;
  isLoading?: boolean;
}

/**
 * TrendAnalysis - Visualizes emotional trends over time.
 *
 * This sophisticated line chart displays time-series data for multiple emotional metrics,
 * with interactive features and responsive design.
 */
export const TrendAnalysis = memo(function TrendAnalysis({
  data = [],
  height = 400,
  isLoading = false,
}: TrendAnalysisProps) {
  const { theme } = useTheme();
  const { timeframe, setTimeframe } = useTimeframe();
  const { trackEvent } = useAnalytics();

  // Transform TrendData into the format expected by ResponsiveLine.
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data.map(series => ({
      id: series.id,
      color: series.color,
      data: series.data.map((point: DataPoint) => ({
        x: typeof point.x === "string"
          ? new Date(point.x).toISOString()
          : point.x,
        y: point.y,
      })),
    }));
  }, [data]);

  // Update timeframe, ensuring the value is of type Timeframe.
  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value);
    trackEvent("trend_timeframe_changed", { timeframe: value });
  };

  // Common card header component.
  const CardHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-medium">Trend Analysis</h3>
        <p className="text-sm text-gray-400">Emotional patterns over time</p>
      </div>
      <div className="relative min-w-[150px]">
        <Select
          value={timeframe}
          onChange={(e) => handleTimeframeChange(e.target.value as Timeframe)}
          disabled={isLoading}
          options={[
            { value: "24h", label: "Last 24 Hours" },
            { value: "week", label: "Last Week" },
            { value: "month", label: "Last Month" },
          ]}
        />
      </div>
    </div>
  );

  // Loading state.
  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader />
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-gray-400">Loading trend data...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Empty state.
  if (!data.length) {
    return (
      <Card className="p-6">
        <CardHeader />
        <div className="flex flex-col items-center justify-center" style={{ height: height - 80 }}>
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h4 className="text-base font-medium mb-2">No Trend Data Available</h4>
          <p className="text-sm text-gray-400 text-center max-w-md">
            Not enough data to display trends. Check back later as more emotional check-ins are collected.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate min/max values for the Y-axis.
  const allYValues = chartData.flatMap(series =>
    series.data.map(point => point.y as number)
  );
  const minY = Math.max(0, Math.floor(Math.min(...allYValues) * 0.9));
  const maxY = Math.ceil(Math.max(...allYValues) * 1.1);

  return (
    <Card className="p-6">
      <CardHeader />
      <div style={{ height }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 25, bottom: 50, left: 45 }}
          xScale={{
            type: "time",
            format: "iso",
            precision: "day",
            useUTC: false,
          }}
          xFormat="time:%Y-%m-%d"
          yScale={{
            type: "linear",
            min: minY,
            max: maxY,
            stacked: false,
          }}
          curve="monotoneX"
          enableArea={true}
          areaOpacity={0.15}
          enablePoints={true}
          pointSize={8}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor", modifiers: [] }}
          enablePointLabel={false}
          pointLabelYOffset={-12}
          enableSlices="x"
          crosshairType="cross"
          colors={{ datum: "color" }}
          theme={{
            textColor:
              theme === "dark"
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.85)",
            fontSize: 12,
            grid: {
              line: {
                stroke:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                strokeWidth: 1,
              },
            },
            crosshair: {
              line: {
                stroke:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.35)"
                    : "rgba(0, 0, 0, 0.35)",
                strokeWidth: 1,
                strokeDasharray: "5 5",
              },
            },
            tooltip: {
              container: {
                background: theme === "dark" ? "#1f2937" : "#ffffff",
                color: theme === "dark" ? "#f3f4f6" : "#111827",
                boxShadow:
                  "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
              },
            },
          }}
          axisBottom={{
            format: "%b %d",
            tickValues: 5,
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -45,
            legend: "Date",
            legendPosition: "middle",
            legendOffset: 40,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: 0,
            legend: "Intensity",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          animate={true}
          motionConfig="gentle"
          legends={[
            {
              anchor: "top-right",
              direction: "column",
              justify: false,
              translateX: 0,
              translateY: 0,
              itemsSpacing: 8,
              itemDirection: "left-to-right",
              itemWidth: 100,
              itemHeight: 20,
              symbolSize: 12,
              symbolShape: "circle",
              itemTextColor:
                theme === "dark"
                  ? "rgba(255, 255, 255, 0.85)"
                  : "rgba(0, 0, 0, 0.85)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: theme === "dark" ? "#ffffff" : "#000000",
                  },
                },
              ],
            },
          ]}
          role="application"
          ariaLabel="Emotional trends over time"
          useMesh={true}
          enableCrosshair={true}
          lineWidth={3}
        />
      </div>
    </Card>
  );
});
