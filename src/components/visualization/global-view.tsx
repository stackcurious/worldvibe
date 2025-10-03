"use client";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";

export function GlobalView() {
  const [data, setData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setData([]); // Set empty array on error
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-update every 30s
    return () => clearInterval(interval);
  }, []);

  const isEmpty = !data || data.length === 0;

  if (!mounted) {
    return (
      <div className="flex justify-center items-center w-full py-10">
        <Card className="w-full max-w-5xl p-8 bg-white/90 dark:bg-gray-900 shadow-xl rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
            🌍 Global Mood Pulse
          </h2>
          <div className="h-[350px] flex items-center justify-center text-gray-500">
            Loading...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full py-10">
      <Card className="w-full max-w-5xl p-8 bg-white/90 dark:bg-gray-900 shadow-xl rounded-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
          🌍 Global Mood Pulse
        </h2>

        {isEmpty ? (
          /* ---------------
           | Empty State  |
           --------------- */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-300"
          >
            <p className="text-xl mb-3">
              The world's vibes are loading...
            </p>
            <p className="text-sm max-w-md mb-6">
              Be the first to share yours, and help fill this live chart
              with real-time emotional data.
            </p>
            <div className="w-20 h-20 mb-4 rounded-full bg-blue-500/20 flex items-center justify-center text-4xl">
              🌍
            </div>
            <Link
              href="/checkin"
              className="px-5 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
            >
              Share Your Vibe
            </Link>
          </motion.div>
        ) : (
          /* ---------------
           | Chart State  |
           --------------- */
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <XAxis
                  dataKey="timestamp"
                  stroke={theme === "dark" ? "#ddd" : "#333"}
                  tick={{ fill: theme === "dark" ? "#ddd" : "#333", fontSize: 14 }}
                />
                <YAxis
                  stroke={theme === "dark" ? "#ddd" : "#333"}
                  tick={{ fill: theme === "dark" ? "#ddd" : "#333", fontSize: 14 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#222" : "#fff",
                    color: theme === "dark" ? "#fff" : "#000",
                    borderRadius: "8px",
                    padding: "10px",
                    fontSize: "14px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="joy"
                  stackId="1"
                  stroke="#FFB800"
                  fill="rgba(255, 184, 0, 0.5)"
                />
                <Area
                  type="monotone"
                  dataKey="calm"
                  stackId="1"
                  stroke="#4CAF50"
                  fill="rgba(76, 175, 80, 0.5)"
                />
                <Area
                  type="monotone"
                  dataKey="stress"
                  stackId="1"
                  stroke="#F44336"
                  fill="rgba(244, 67, 54, 0.5)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
