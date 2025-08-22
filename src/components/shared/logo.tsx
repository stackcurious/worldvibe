
// src/components/shared/logo.tsx
"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export function Logo() {
 return (
   <Link href="/" className="flex items-center gap-2">
     <motion.div
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
       className="flex items-center"
     >
       <div className="relative w-8 h-8">
         <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-pulse" />
         <div className="absolute inset-1 bg-blue-500 rounded-full" />
       </div>
       <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
         WorldVibe
       </span>
     </motion.div>
   </Link>
 );
}