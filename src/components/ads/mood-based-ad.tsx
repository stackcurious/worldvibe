"use client";
import { memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useAnalytics } from "@/hooks/use-analytics";
import { AdPlacement } from "@/types";
import { getEmotionBasedMessage } from "@/lib/emotion-messages";

interface MoodBasedAdProps {
  emotion: string;
  placement: AdPlacement;
  onImpression?: () => void;
  onClose?: () => void;
}

export const MoodBasedAd = memo(function MoodBasedAd({
  emotion,
  placement,
  onImpression,
  onClose,
}: MoodBasedAdProps) {
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (inView) {
      onImpression?.();
      trackEvent("ad_impression", {
        emotion,
        placement,
      });
    }
  }, [inView, emotion, placement, onImpression, trackEvent]);

  const handleClick = () => {
    trackEvent("ad_click", {
      emotion,
      placement,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        className="relative overflow-hidden rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        {/* Ad content optimized for emotion */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          
          <div className="space-y-2">
            <h3 className="font-medium text-lg">
              Because you're feeling {emotion}...
            </h3>
            <p className="text-sm text-gray-600">
              {getEmotionBasedMessage(emotion)}
            </p>
            <button
              onClick={handleClick}
              className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
