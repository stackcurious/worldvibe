"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Sun,
  Globe,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GlobalView } from "@/components/visualization/global-view";
import { RegionalBreakdown } from "@/components/regional/breakdown";
import FloatingCTA from "@/components/ui/FloatingCTA"; // ✅ Importing Floating CTA

export default function LandingPage() {
  const [timeRange, setTimeRange] = useState("24h");

  const moodData = {
    "24h": [
      { time: "6am", Joy: 68, Calm: 45, Stress: 20 },
      { time: "9am", Joy: 72, Calm: 40, Stress: 35 },
      { time: "12pm", Joy: 65, Calm: 50, Stress: 30 },
      { time: "3pm", Joy: 58, Calm: 55, Stress: 28 },
      { time: "6pm", Joy: 70, Calm: 60, Stress: 15 },
      { time: "9pm", Joy: 75, Calm: 65, Stress: 10 },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-blue-900 text-white">
      {/* ✅ Scroll-activated Floating CTA */}
      <FloatingCTA />

      {/* 🌟 Hero Section */}
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 pt-16 text-center"
      >
        <h1 className="text-5xl font-bold mb-4">
          Share Your Vibe, Shape the World
        </h1>
        <p className="text-lg text-blue-100 max-w-xl mx-auto">
          Join millions in mapping how our planet feels. Add your check‑in to
          influence real‑time global mood data.
        </p>
        <div className="mt-6">
          <Link href="/checkin">
            <span className="inline-block px-6 py-3 bg-blue-500 rounded-full text-white font-medium hover:bg-blue-600 transition-colors shadow-lg transform hover:scale-105">
              Contribute Your Check‑In
            </span>
          </Link>
        </div>
      </motion.header>

      {/* 📊 Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="container mx-auto mt-12 grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          {
            title: "Daily Check-ins",
            value: "2.3M",
            icon: Users,
            trend: 12.5,
          },
          {
            title: "Active Countries",
            value: "195",
            icon: Globe,
            trend: 0,
          },
          {
            title: "Trending Emotion",
            value: "Joy",
            icon: Sun,
            trend: 5.4,
          },
          {
            title: "Positive Sentiment",
            value: "82%",
            icon: Heart,
            trend: 3.2,
          },
        ].map(({ title, value, icon: Icon, trend }, index) => (
          <motion.div
            key={index}
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg border border-white/20 shadow-md"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200">{title}</p>
                <h3 className="text-3xl font-bold">{value}</h3>
              </div>
              <Icon className="w-6 h-6 text-blue-300" />
            </div>
            {trend !== undefined && (
              <p
                className={`text-sm mt-2 ${
                  trend > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3 inline-block" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline-block" />
                )}
                {` ${trend}% from yesterday`}
              </p>
            )}
          </motion.div>
        ))}
      </motion.section>

      {/* 📈 Global Mood Trends */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto mt-12 bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20"
      >
        <h3 className="text-2xl font-semibold text-center mb-6">
          🌍 Global Mood Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={moodData["24h"]}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Joy"
                stroke="#FFB800"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="Calm"
                stroke="#4CAF50"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="Stress"
                stroke="#F44336"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* 🌍 Global & Regional Insights */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="container mx-auto mt-12 p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20"
      >
        <Suspense fallback={<LoadingSpinner />}>
          <GlobalView />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <RegionalBreakdown />
        </Suspense>
      </motion.section>
    </div>
  );
}
