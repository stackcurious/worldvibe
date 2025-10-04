"use client";

import { memo, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/globe', label: 'Explore Globe' },
  { href: '/checkin', label: 'Check In' },
  { href: '/about', label: 'About' }
];

export const Header = memo(function Header() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [showCTA, setShowCTA] = useState(true);
  const pathname = usePathname();

  // Detect scroll direction & toggle header visibility
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 100);
    setShowCTA(latest < previous || latest < 100);
  });

  return (
    <>
      {/* Main Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-lg shadow-lg border-b border-white/10"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between container mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-bold text-white">WorldVibe</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  className="relative py-2"
                >
                  <span className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-yellow-400' : 'text-gray-200 hover:text-white'
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navigation-underline"
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-yellow-400"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA Button */}
          <Link
            href="/checkin"
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full font-bold text-sm text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Heart className="w-4 h-4" />
            Share Your Vibe
          </Link>
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
          href="/checkin"
          className="group relative px-6 py-4 bg-gradient-to-r from-yellow-400 to-pink-500 text-white rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
          <Sparkles className="w-6 h-6 relative z-10 animate-pulse" />
          <span className="font-bold text-lg relative z-10">Check In</span>
        </Link>
      </motion.div>
    </>
  );
});
