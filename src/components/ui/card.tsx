"use client";

import { cn } from "@/utils/classnames";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component used as a container with default rounded corners,
 * shadow, background colors, and padding. This maintains the existing
 * styling for old usages.
 */
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg shadow-md bg-white dark:bg-gray-900 p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * CardContent component provides a default padding for card inner content.
 * Use this inside the Card component to structure your layout more precisely.
 */
export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}
