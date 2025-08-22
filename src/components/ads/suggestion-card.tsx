"use client";
import { memo, useEffect } from "react"; // Added useEffect import
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Card } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/use-analytics";
import Image from "next/image"; // Ensure Image is imported
import { ArrowRight } from "lucide-react"; // Import icon

interface SuggestionCardProps {
  suggestion: {
    id: string;
    title: string;
    description: string;
    emotion: string;
    imageUrl?: string;
    link?: string;
  };
  onInteraction?: (type: "impression" | "click") => void;
}

export const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onInteraction,
}: SuggestionCardProps) {
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (inView) {
      onInteraction?.("impression");
      trackEvent("suggestion_impression", {
        suggestionId: suggestion.id,
        emotion: suggestion.emotion,
      });
    }
  }, [inView, suggestion, onInteraction, trackEvent]);

  const handleClick = () => {
    onInteraction?.("click");
    trackEvent("suggestion_click", {
      suggestionId: suggestion.id,
      emotion: suggestion.emotion,
    });
  };

  return (
    <motion.div ref={ref} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        onClick={handleClick}
        className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      >
        {suggestion.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={suggestion.imageUrl}
              alt={suggestion.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-medium text-lg">{suggestion.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {suggestion.description}
          </p>
          {suggestion.link && (
            <a
              href={suggestion.link}
              className="text-blue-500 hover:text-blue-600 text-sm inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
