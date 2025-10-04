"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { DatabaseStatus } from "@/components/ui/database-status";

// Define Footer Links
const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "https://twitter.com/worldvibe", label: "Twitter", external: true },
  { href: "https://github.com/worldvibe", label: "GitHub", external: true },
];

export const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();
  const [checkInCount, setCheckInCount] = useState<number | null>(null);

  useEffect(() => {
    // Simulated live check-in counter
    setTimeout(() => {
      setCheckInCount(Math.floor(Math.random() * 50000) + 10000);
    }, 1000);
  }, []);

  return (
    <footer className="w-full py-6 pb-24 md:pb-6 border-t border-gray-700 bg-black/60 backdrop-blur-md text-center text-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Logo & Copyright */}
        <div className="flex flex-col items-center md:flex-row gap-2 text-sm">
          <span className="text-gray-300">© {currentYear} WorldVibe</span>
          <span className="hidden md:inline">•</span>
          <span className="flex items-center gap-1 text-gray-300">
            Made with <Heart className="h-4 w-4 text-red-500" /> globally
          </span>
        </div>

        {/* Live Check-in Counter & Database Status */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {checkInCount && (
            <div className="text-sm text-gray-300">
              🌎 {checkInCount.toLocaleString()} emotional check-ins today
            </div>
          )}
          <div className="text-xs bg-black/30 rounded-full px-3 py-1">
            <DatabaseStatus minimal className="inline-flex" /> 
            <span className="ml-1 text-gray-300">DB Status</span>
          </div>
        </div>

        {/* Footer Links */}
        <nav className="flex gap-4 text-sm">
          {footerLinks.map(({ href, label, external }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-300 transition-all hover:text-white"
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Admin Section with Full Database Status (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center">
          <DatabaseStatus className="bg-gray-900 rounded-lg p-2 text-xs" />
        </div>
      )}
    </footer>
  );
});
