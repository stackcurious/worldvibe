"use client";
import { memo } from "react";
import { Card } from "@/components/ui/card";
import { useGlobalStore } from "@/stores/global-store";
import { motion } from "framer-motion";

export const RegionalBreakdown = memo(function RegionalBreakdown() {
  const regionalData = useGlobalStore((state) => state.regionalData);
  const regionKeys = Object.keys(regionalData || {});
  const isEmpty = regionKeys.length === 0;

  return (
    <Card className="p-8 bg-gradient-to-b from-blue-900 to-blue-700 text-white shadow-xl rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        🌍 Regional Mood Breakdown
      </h2>

      {isEmpty ? (
        /* ---------------
         | Empty State  |
         --------------- */
        <motion.div
          className="flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-lg mb-2">No regions are reporting… yet.</p>
          <p className="text-sm mb-4 max-w-md">
            The world is waiting to hear from you! Share your vibe
            and watch this space fill up with colorful moods from
            across the globe.
          </p>
          <motion.div
            className="w-20 h-20 mb-4 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold"
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 10,
              ease: "linear",
            }}
          >
            🌐
          </motion.div>
          <a
            href="/check-in"
            className="inline-block px-5 py-3 bg-white text-blue-700 font-medium rounded-full hover:bg-blue-50 transition-colors"
          >
            Share Your Vibe
          </a>
        </motion.div>
      ) : (
        /* ---------------
         | Data State   |
         --------------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {regionKeys.map((region) => {
            const data = regionalData[region];
            return (
              <motion.div
                key={region}
                whileHover={{ scale: 1.03 }}
                className="p-6 rounded-xl bg-white bg-opacity-10 border border-blue-400 shadow-lg transition-all duration-200"
              >
                <h3 className="font-medium text-lg text-white">{region}</h3>
                <p className="text-3xl font-semibold text-yellow-400 mt-2">
                  {data.dominantEmotion}
                </p>
                <p className="text-sm text-gray-200">
                  {data.checkInCount.toLocaleString()} check-ins
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
});
