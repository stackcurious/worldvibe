"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, TrendingUp, Globe, LogOut } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classNames

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { href: "/dashboard/trends", label: "Trends", icon: <TrendingUp className="w-5 h-5" /> },
  { href: "/dashboard/regions", label: "Regions", icon: <Globe className="w-5 h-5" /> },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full md:w-60 bg-gray-900 border-r border-gray-700 min-h-screen px-4 py-6">
      <ul className="space-y-2">
        {links.map(({ href, label, icon }) => (
          <li key={href}>
            <Link href={href} passHref>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all",
                  pathname === href
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-800"
                )}
              >
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </motion.button>
            </Link>
          </li>
        ))}
      </ul>

      {/* Logout Button */}
      <div className="mt-6">
        <button className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
