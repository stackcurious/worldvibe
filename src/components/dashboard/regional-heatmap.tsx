"use client";

import { memo, useMemo, useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import worldCountries from "@/data/world_countries.json";

// Dynamically import ResponsiveChoropleth to avoid SSR issues.
const ResponsiveChoropleth = dynamic(
  () => import("@nivo/geo").then((mod) => mod.ResponsiveChoropleth),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center text-gray-300">
        Loading heatmap...
      </div>
    ),
  }
);

export type RegionalHeatmapData = {
  id: string; // ISO 3166‑1 alpha‑3 country code, e.g., "USA"
  value: number;
  description?: string; // Extra insights about the country
};

interface RegionalHeatmapProps {
  data?: RegionalHeatmapData[];
}

export const RegionalHeatmap = memo(function RegionalHeatmap({
  data = [],
}: RegionalHeatmapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<RegionalHeatmapData | null>(null);

  useEffect(() => {
    setTimeout(() => setMapLoaded(true), 500);
  }, []);

  // Compute min/max for color scaling.
  const [minValue, maxValue] = useMemo(() => {
    if (data.length === 0) return [0, 100];
    const values = data.map((d) => d.value);
    return [Math.min(...values), Math.max(...values)];
  }, [data]);

  return (
    <Card className="w-full h-full p-6 bg-gray-900 border border-gray-700 rounded-xl shadow-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full w-full"
      >
        <h3 className="text-xl font-semibold text-white mb-2">
          Regional Heatmap
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Explore emotional intensity worldwide.
        </p>

        {/* Heatmap Container */}
        <div
          className={`h-[400px] w-full transition-opacity duration-500 ${
            mapLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-gray-400">
                Loading heatmap...
              </div>
            }
          >
            <ResponsiveChoropleth
              data={data}
              features={worldCountries.features}
              match={(d) => d.properties?.iso_a3 || d.id}
              value="value"
              domain={[minValue, maxValue]}
              unknownColor="#333333"
              colors={[
                "#f0fdfa",
                "#34d399",
                "#10b981",
                "#059669",
                "#047857",
              ]}
              label="properties.name"
              valueFormat=".2f"
              projectionType="naturalEarth1"
              projectionScale={140}
              projectionTranslation={[0.5, 0.6]}
              enableGraticule={false}
              borderWidth={0.4}
              borderColor="#555"
              legends={[
                {
                  anchor: "bottom-right",
                  direction: "column",
                  justify: true,
                  translateX: 0,
                  translateY: -40,
                  itemWidth: 80,
                  itemHeight: 18,
                  itemsSpacing: 4,
                  itemDirection: "left-to-right",
                  symbolSize: 18,
                  itemTextColor: "#ddd",
                },
              ]}
              // ✅ CLICK HANDLER: Open Modal when clicking a country.
              onClick={(feature) => {
                // In @nivo/geo, the ChoroplethBoundFeature has a different structure
                // We need to extract the country code from it
                const countryId = String(feature.data?.id || "unknown");
                  
                const clickedCountry = data.find((d) => d.id === countryId);
                setSelectedCountry(
                  clickedCountry || {
                    id: countryId,
                    value: 0,
                    description: "No additional data available.",
                  }
                );
              }}
            />
          </Suspense>
        </div>

        {/* Modal for Country Insights */}
        <AnimatePresence>
          {selectedCountry && (
            <Modal 
              isOpen={!!selectedCountry}
              onClose={() => setSelectedCountry(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl max-w-md mx-auto"
              >
                <h2 className="text-2xl font-semibold text-white">
                  {selectedCountry.id}
                </h2>
                <p className="text-gray-300 mt-2">
                  Emotional Intensity:{" "}
                  <span className="font-bold text-green-400">
                    {selectedCountry.value}
                  </span>
                </p>
                <p className="text-gray-400 mt-4">
                  {selectedCountry.description}
                </p>
                <button
                  className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                  onClick={() => setSelectedCountry(null)}
                >
                  Close
                </button>
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
});