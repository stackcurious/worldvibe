"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show after scrolling 200px down
      const shouldShow = scrollY > 200;
      
      // Hide when near bottom (to avoid footer overlap)
      const isNearBottom = scrollY + windowHeight >= documentHeight - 200;
      
      setIsVisible(shouldShow && !isNearBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Link href="/checkin">
      <motion.div
        className="group fixed bottom-6 right-6 z-50 px-6 py-4 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full shadow-2xl cursor-pointer overflow-hidden"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
        aria-label="Share your emotional check-in"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
        <div className="flex items-center gap-3 relative z-10">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
          <span className="font-bold text-lg text-white">Check In</span>
        </div>
      </motion.div>
    </Link>
  );
}
