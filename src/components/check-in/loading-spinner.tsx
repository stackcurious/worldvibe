// src/components/check-in/loading-spinner.tsx
"use client";

import { motion } from 'framer-motion';

export const LoadingSpinner = () => (
  <motion.div
    className="flex items-center space-x-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.span
      className="block w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <span className="text-gray-600 dark:text-gray-300">Sharing...</span>
  </motion.div>
);
