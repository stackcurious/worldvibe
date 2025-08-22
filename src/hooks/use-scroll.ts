// src/hooks/use-scroll.ts
import { useState, useEffect } from 'react';

interface ScrollInfo {
  scrollY: number;
  scrollX: number;
  direction: 'up' | 'down' | null;
  lastScrollY: number;
}

export function useScroll() {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
    scrollY: 0,
    scrollX: 0,
    direction: null,
    lastScrollY: 0
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollInfo(prev => {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const direction = scrollY > prev.lastScrollY ? 'down' : 'up';

        return {
          scrollY,
          scrollX,
          direction,
          lastScrollY: scrollY
        };
      });
    };

    // Initial call
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollInfo;
}