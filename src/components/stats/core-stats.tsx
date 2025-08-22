"use client";
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsData {
 totalCheckins: number;
 activeRegions: number;
 dominantMood: string;
}

export const CoreStats = memo(function CoreStats() {
 const stats = [
   {
     label: 'Global Check-ins',
     value: formatNumber(totalCheckins),
     icon: Users,
     color: 'text-blue-500'
   },
   {
     label: 'Active Regions',
     value: formatNumber(activeRegions),
     icon: Globe,
     color: 'text-green-500'
   },
   {
     label: 'World Mood',
     value: dominantMood,
     icon: TrendingUp,
     color: 'text-purple-500'
   }
 ];

 return (
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
     {stats.map((stat, index) => (
       <motion.div
         key={stat.label}
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: index * 0.1 }}
       >
         <StatCard {...stat} />
       </motion.div>
     ))}
   </div>
 );
});