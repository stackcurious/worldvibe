"use client";

import { memo, useMemo } from "react";
import { ResponsiveChoropleth } from "@nivo/geo";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchGeoData } from "@/lib/api";
import { WORLD_GEOJSON } from "@/config/geo";
import type { RegionalData } from "@/types";

interface RegionalBreakdownProps {
  data?: RegionalData[];
  isLoading?: boolean;
  onRegionClick?: (region: string) => void;
}

export const RegionalBreakdown = memo(function RegionalBreakdown({
  data = [],
  isLoading,
  onRegionClick,
}: RegionalBreakdownProps) {
  const { theme } = useTheme();

  // Optionally fetch updated geo data if needed.
  const { data: geoData } = useQuery({
    queryKey: ["geo-data"],
    queryFn: fetchGeoData,
    staleTime: Infinity,
  });

  // Prepare the data for the choropleth.
  const formattedData = useMemo(
    () =>
      data.map((item) => ({
        id: item.regionCode,
        value: item.emotionalIndex,
        data: item,
      })),
    [data]
  );

  // Custom tooltip using the feature object provided by nivo.
  const customTooltip = (feature: any) => {
    // Access the region code from feature.data.id
    const regionData = data.find((d) => d.regionCode === feature.data.id);
    if (!regionData) return null;

    return (
      <div className="bg-white p-2 shadow-lg rounded-lg border">
        <h3 className="font-medium">
          {feature.feature.properties.name}
        </h3>
        <div className="text-sm">
          <p>Dominant Emotion: {regionData.dominantEmotion}</p>
          <p>Intensity: {regionData.averageIntensity.toFixed(1)}</p>
          <p>Check-ins: {regionData.checkInCount.toLocaleString()}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-[500px] flex items-center justify-center">
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">
          Regional Mood Map
        </h2>
        <div className="h-[500px]">
          <ResponsiveChoropleth
            data={formattedData}
            features={WORLD_GEOJSON.features}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            colors="blues"
            domain={[0, 100]}
            unknownColor="#666666"
            label="properties.name"
            valueFormat=".2s"
            projectionScale={140}
            projectionTranslation={[0.5, 0.5]}
            projectionRotation={[0, 0, 0]}
            enableGraticule={true}
            graticuleLineColor={
              theme === "dark"
                ? "rgba(255,255,255,0.2)"
                : "rgba(0,0,0,0.1)"
            }
            borderWidth={0.5}
            borderColor="#152538"
            tooltip={customTooltip}
            onClick={(feature) =>
              onRegionClick?.(feature.data.id)
            }
          />
        </div>
      </div>
    </Card>
  );
});
