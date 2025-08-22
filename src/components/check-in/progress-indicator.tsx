// src/components/check-in/progress-indicator.tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: string;
}

export const ProgressIndicator = ({ steps, currentStep }: ProgressIndicatorProps) => {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="relative">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                index <= currentIndex ? "bg-blue-500" : "bg-gray-300"
              )}
            />
            {index <= currentIndex && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-500 opacity-50"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-1",
                index < currentIndex ? "bg-blue-500" : "bg-gray-300"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};