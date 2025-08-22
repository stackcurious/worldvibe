// src/components/shared/loading-spinner.tsx
"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface FullPageSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function FullPageSpinner({ size = "lg" }: FullPageSpinnerProps) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size={size} />
    </div>
  );
}

export { LoadingSpinner };