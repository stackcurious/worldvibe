
// src/components/shared/logo.tsx
"use client";
import { motion } from "framer-motion";

export function Logo() {
 return (
   <motion.div
     whileHover={{ scale: 1.05 }}
     whileTap={{ scale: 0.95 }}
     className="flex items-center"
   >
     <div className="relative w-8 h-8">
       <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-pulse" />
       <div className="absolute inset-1 bg-blue-500 rounded-full" />
     </div>
   </motion.div>
 );
}