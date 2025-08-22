// src/components/layout/navigation.tsx
"use client";
import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAnalytics } from '@/hooks/use-analytics';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trends', label: 'Trends' },
  { href: '/regions', label: 'Regions' }
];

export const Navigation = memo(function Navigation() {
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  const handleNavClick = (label: string) => {
    trackEvent('navigation_click', { destination: label });
  };

  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navItems.map(({ href, label }) => {
        const isActive = pathname === href;
        
        return (
          <Link
            key={href}
            href={href}
            onClick={() => handleNavClick(label)}
            className="relative py-2"
          >
            <span className={`text-sm font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}>
              {label}
            </span>
            {isActive && (
              <motion.div
                layoutId="navigation-underline"
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-600"
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
  );
});