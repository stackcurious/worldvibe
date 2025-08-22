"use client";

import { memo, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { BarChart3, RefreshCw, PlusCircle } from "lucide-react";
import Link from "next/link";

export const Header = memo(function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [showCTA, setShowCTA] = useState(true);

  // Detect scroll direction & toggle header visibility
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 100);
    setShowCTA(latest < previous || latest < 100); // Show CTA when scrolling up
  });

  return (
    <>
      {/* Main Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-3 bg-white/80 dark:bg-black/60 backdrop-blur-lg shadow-md transition-all"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between container mx-auto">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            <Logo />
          </Link>

          {/* Navigation Icons */}
          <div className="flex items-center gap-4">
            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              className="p-2 rounded-lg bg-white/10 dark:bg-black/20 text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-black/30 transition-all"
            >
              <BarChart3 className="w-5 h-5" />
            </Link>

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg bg-white/10 dark:bg-black/20 text-gray-800 dark:text-white hover:bg-white/20 dark:hover:bg-black/30 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Floating Check-in CTA Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: showCTA ? 1 : 0, scale: showCTA ? 1 : 0.95 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <Link
          href="/check-in"
          className="px-5 py-4 bg-blue-500 text-white rounded-full shadow-lg flex items-center gap-2 hover:bg-blue-600 transition-all transform hover:scale-105"
        >
          <PlusCircle className="w-6 h-6" />
          <span className="font-semibold">Check In</span>
        </Link>
      </motion.div>
    </>
  );
});
