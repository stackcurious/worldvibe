"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BarChart3, Home, PlusCircle } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

export const MobileNav = memo(function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  const navItems = [
    { href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const handleNavClick = (label: string) => {
    setIsOpen(false);
    trackEvent("mobile_nav_click", { destination: label });
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center p-3 bg-white/10 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Full-Screen Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center space-y-6 text-white"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 rounded-full shadow-lg transition-all hover:scale-110"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation Items */}
            <nav className="text-lg space-y-4">
              {navItems.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all text-lg ${
                    pathname === href ? "bg-blue-500 text-white" : "hover:bg-white/10"
                  }`}
                  onClick={() => handleNavClick(label)}
                >
                  {icon} {label}
                </Link>
              ))}
            </nav>

            {/* Floating Check-in CTA */}
            <Link
              href="/checkin"
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 rounded-full shadow-lg transition-all hover:scale-105"
              onClick={() => setIsOpen(false)}
            >
              <PlusCircle className="w-6 h-6" />
              Check In
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
