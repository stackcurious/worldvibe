// @ts-nocheck
"use client";
import { useQuery } from '@tanstack/react-query';
import { useAnalytics } from './use-analytics';

interface Ad {
  id: string;
  type: string;
  content: any;
  targeting: {
    emotion?: string;
    region?: string;
    timeOfDay?: string;
  };
}

export function useAds(context: {
  emotion?: string;
  region?: string;
}) {
  const { trackEvent } = useAnalytics();

  const { data: ads, isLoading, error } = useQuery({
    queryKey: ['ads', context],
    queryFn: async () => {
      const params = new URLSearchParams(context);
      const res = await fetch(`/api/ads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch ads');
      return res.json();
    },
    staleTime: 60000, // 1 minute
  });

  const trackAdImpression = useCallback((adId: string) => {
    trackEvent('ad_impression', { adId, ...context });
  }, [trackEvent, context]);

  const trackAdClick = useCallback((adId: string) => {
    trackEvent('ad_click', { adId, ...context });
  }, [trackEvent, context]);

  return {
    ads: ads?.ads || [],
    isLoading,
    error,
    trackAdImpression,
    trackAdClick
  };
}