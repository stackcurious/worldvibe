"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Smile,
  Sparkles,
  Globe as GlobeIcon,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import FloatingCTA from "@/components/ui/FloatingCTA";
import { LiveCheckInToast } from "@/components/notifications/live-checkin-toast";
import { CountryGrid } from "@/components/landing/country-grid";

// Emotion colors matching our config
const EMOTION_COLORS = {
  joy: "#FFB800",
  calm: "#4CAF50",
  stress: "#F44336",
  anticipation: "#FF9800",
  sadness: "#2196F3",
};

// Floating emotion bubbles background
function EmotionBubbles() {
  const emotions = ["😊", "😌", "😰", "🤩", "😢", "❤️", "✨", "🌟", "💫"];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
      {emotions.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            opacity: 0,
          }}
          animate={{
            y: -100,
            opacity: [0, 1, 1, 0],
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Live stats ticker
function LiveStatsTicker() {
  const [stats, setStats] = useState({
    checkInsToday: 0,
    activeNow: 0,
    countries: 0,
  });

  useEffect(() => {
    // Animate numbers counting up
    const target = { checkInsToday: 42381, activeNow: 1247, countries: 195 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStats({
        checkInsToday: Math.floor((target.checkInsToday * step) / steps),
        activeNow: Math.floor((target.activeNow * step) / steps),
        countries: Math.floor((target.countries * step) / steps),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-8 justify-center items-center py-8"
    >
      {[
        { label: "Check-ins today", value: stats.checkInsToday.toLocaleString(), icon: Heart },
        { label: "People online now", value: stats.activeNow.toLocaleString(), icon: Users },
        { label: "Countries", value: stats.countries, icon: GlobeIcon },
      ].map((stat, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-full border border-white/20"
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <stat.icon className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-300">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Real-time emotion wave
function EmotionWave() {
  const [activeEmotion, setActiveEmotion] = useState(0);
  const emotions = [
    { name: "Joy", emoji: "😊", color: EMOTION_COLORS.joy, percent: 34 },
    { name: "Calm", emoji: "😌", color: EMOTION_COLORS.calm, percent: 28 },
    { name: "Anticipation", emoji: "🤩", color: EMOTION_COLORS.anticipation, percent: 18 },
    { name: "Stress", emoji: "😰", color: EMOTION_COLORS.stress, percent: 12 },
    { name: "Sadness", emoji: "😢", color: EMOTION_COLORS.sadness, percent: 8 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEmotion((prev) => (prev + 1) % emotions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.h3
        className="text-center text-2xl font-bold text-white mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Right now, the world is feeling...
      </motion.h3>

      <div className="flex gap-4 justify-center flex-wrap">
        {emotions.map((emotion, i) => (
          <motion.div
            key={i}
            className="relative cursor-pointer"
            onHoverStart={() => setActiveEmotion(i)}
            animate={{
              scale: activeEmotion === i ? 1.2 : 1,
              y: activeEmotion === i ? -10 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div
              className="relative backdrop-blur-xl rounded-2xl p-6 border-2 transition-all"
              style={{
                backgroundColor: activeEmotion === i ? `${emotion.color}20` : "rgba(255,255,255,0.05)",
                borderColor: activeEmotion === i ? emotion.color : "rgba(255,255,255,0.1)",
              }}
            >
              <div className="text-5xl mb-2 text-center">{emotion.emoji}</div>
              <div className="text-center">
                <div className="font-bold text-white text-lg">{emotion.name}</div>
                <div
                  className="text-3xl font-bold mt-1"
                  style={{ color: emotion.color }}
                >
                  {emotion.percent}%
                </div>
              </div>

              {/* Animated pulse ring */}
              {activeEmotion === i && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: `2px solid ${emotion.color}` }}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden relative">
      {/* Floating emotion bubbles */}
      <EmotionBubbles />

      {/* Live notifications */}
      <LiveCheckInToast />

      {/* Floating CTA */}
      <FloatingCTA />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Sparkle badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">42,381 check-ins in the last 24 hours</span>
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>

          {/* Main headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
              How's the world
            </span>
            <br />
            <span className="text-white">feeling today?</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
            Join a global community sharing their daily emotional pulse.
            See how the world feels in real-time, discover patterns, and feel less alone. 🌍✨
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/checkin"
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-lg text-white shadow-2xl overflow-hidden"
              >
                <span className="relative flex items-center gap-2">
                  Share Your Vibe <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/globe"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full font-bold text-lg border-2 border-white/20 hover:bg-white/20 transition-colors"
              >
                Explore the Globe 🌐
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Live Stats Ticker */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        <LiveStatsTicker />
      </section>

      {/* Real-time Emotion Wave */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <EmotionWave />
      </section>

      {/* Country Grid */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <CountryGrid />
      </section>

      {/* Why WorldVibe Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-5xl font-bold text-center mb-16">
            Why people check in daily
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Feel Connected",
                description: "See you're not alone in how you feel. Thousands share their emotional journey every day.",
                color: "#FF6B9D",
              },
              {
                icon: Sparkles,
                title: "Discover Patterns",
                description: "Track global moods, find correlations, and understand the emotional pulse of humanity.",
                color: "#FFB800",
              },
              {
                icon: Zap,
                title: "Anonymous & Safe",
                description: "Your privacy matters. All check-ins are completely anonymous and secure.",
                color: "#4CAF50",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 h-full hover:bg-white/10 transition-all">
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${feature.color}20` }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>

                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl -z-10 transition-opacity"
                  style={{ backgroundColor: feature.color }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Social Proof / Community Highlights */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold mb-8">
            Join the global conversation
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { number: "195", label: "Countries" },
              { number: "2.3M", label: "Daily check-ins" },
              { number: "68%", label: "Positive vibes" },
              { number: "100%", label: "Anonymous" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-300 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 container mx-auto px-4 py-20 pb-32">
        <motion.div
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-12 border border-white/20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-bold mb-6">
            Ready to share your vibe?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            It takes 10 seconds. Your voice matters. The world is listening. 💙
          </p>

          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Link
              href="/checkin"
              className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-xl text-white shadow-2xl"
            >
              Start Your First Check-in ✨
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
