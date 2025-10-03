// @ts-nocheck
"use client";

import { memo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

import { Card } from "@/components/ui/card";
import { fetchCheckIns } from "@/lib/api";
import { CheckIn } from "@/types";

// Type for a single check-in card
interface CheckInCardProps {
  checkIn: CheckIn;
}

// A simple placeholder card for individual check-ins.
function CheckInCard({ checkIn }: CheckInCardProps) {
  return (
    <div className="p-4 mb-2 bg-gray-800 bg-opacity-40 rounded-md shadow-sm">
      <p className="text-sm text-gray-100">
        {checkIn.userId || 'Anonymous'} feels {checkIn.emotion} 
        {checkIn.note ? ` because ${checkIn.note}` : ''}
      </p>
      <p className="text-xs text-gray-400">
        at {new Date(checkIn.timestamp).toLocaleString()}
        {checkIn.region ? ` from ${checkIn.region}` : ''}
      </p>
    </div>
  );
}

export const RealtimeFeed = memo(function RealtimeFeed() {
  const parentRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["check-ins"],
    queryFn: ({ pageParam = 1 }) => fetchCheckIns(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: process.env.NODE_ENV === 'production' ? 5000 : undefined, // Only refetch in production
  });

  // Memoize the fetch handler to prevent unnecessary re-renders
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Use our enhanced intersection observer
  useIntersectionObserver({
    target: loaderRef,
    onIntersect: handleLoadMore,
    enabled: !!hasNextPage && !isFetchingNextPage,
    threshold: 0.5,
    rootMargin: '200px', // Trigger loading earlier for smoother experience
    once: false, // Keep observing for infinite scroll
  });

  const allRows = data?.pages.flatMap((page) => page.items) ?? [];
  const virtualizer = useVirtualizer({
    count: allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  // Handle loading and error states
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-[600px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading feed...</div>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="h-[600px] flex items-center justify-center">
          <div className="text-red-400">
            <p>Failed to load check-ins</p>
            <button 
              onClick={() => fetchNextPage()} 
              className="mt-4 px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (allRows.length === 0) {
      return (
        <div className="h-[600px] flex items-center justify-center">
          <div className="text-gray-400">No check-ins available at the moment.</div>
        </div>
      );
    }

    return (
      <div ref={parentRef} className="h-[600px] overflow-auto relative px-4 pt-4">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <AnimatePresence>
            {items.map((virtualRow) => {
              const checkIn = allRows[virtualRow.index];
              return (
                <motion.div
                  key={checkIn?.id ?? virtualRow.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {checkIn && <CheckInCard checkIn={checkIn} />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">Live Feed</h2>
        <p className="text-gray-400 text-sm">
          Real-time emotional check-ins from around the world
        </p>
      </div>

      {renderContent()}

      {/* Infinite Scroll Trigger */}
      <div 
        ref={loaderRef} 
        className="p-4 text-center text-gray-400"
        aria-hidden="true"  // It's just a marker for the IntersectionObserver
      >
        {isFetchingNextPage
          ? "Loading more check-ins..."
          : hasNextPage
          ? "Scroll for more check-ins"
          : "No more check-ins available"}
      </div>
    </Card>
  );
});