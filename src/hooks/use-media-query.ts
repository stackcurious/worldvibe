// src/hooks/use-media-query.ts
"use client";

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]); // Only re-run if query changes

  return matches;
}

// Example usage:
// const isMobile = useMediaQuery('(max-width: 768px)');
// const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');