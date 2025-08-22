"use client";

import { useTimeframe } from "@/hooks/use-timeframe";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Ensure you have a class utility function

const timeframes = ["24h", "week", "month"] as const;

export function TimeframeSelector() {
  const { timeframe, setTimeframe } = useTimeframe();

  return (
    <div className="relative flex justify-center bg-gray-900 p-2 rounded-xl border border-gray-700 shadow-md w-full max-w-sm">
      {timeframes.map((tf) => (
        <motion.button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-lg transition-all",
            timeframe === tf
              ? "bg-blue-500 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800"
          )}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {tf.toUpperCase()}
        </motion.button>
      ))}
    </div>
  );
}
