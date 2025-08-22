// src/components/home/global-stats.tsx
"use client";
import { memo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, TrendingUp } from 'lucide-react';
import { fetchGlobalStats } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { SkeletonCard } from '@/components/shared/skeleton';

interface GlobalStatsProps {
 compact?: boolean;
}

export const GlobalStats = memo(function GlobalStats({
 compact = false
}: GlobalStatsProps) {
 const { data, isLoading } = useQuery({
   queryKey: ['global-stats'],
   queryFn: fetchGlobalStats,
   refetchInterval: 30000 // Refetch every 30 seconds
 });

 if (isLoading) {
   return <SkeletonStats compact={compact} />;
 }

 const stats = [
   {
     label: 'Daily Check-ins',
     value: data?.checkIns.toLocaleString() ?? '0',
     icon: Users,
     color: 'text-blue-500'
   },
   {
     label: 'Active Countries',
     value: data?.countries.toLocaleString() ?? '0',
     icon: Globe,
     color: 'text-green-500'
   },
   {
     label: 'Current Vibe',
     value: data?.dominantEmotion ?? 'Loading...',
     icon: TrendingUp,
     color: 'text-purple-500'
   }
 ];

 return (
   <div className={`grid ${compact ? 'grid-cols-3' : 'md:grid-cols-3'} gap-4`}>
     {stats.map((stat, index) => (
       <StatCard
         key={stat.label}
         {...stat}
         delay={index * 0.1}
         compact={compact}
       />
     ))}
   </div>
 );
});

interface StatCardProps {
 label: string;
 value: string;
 icon: any;
 color: string;
 delay: number;
 compact?: boolean;
}

const StatCard = memo(function StatCard({
 label,
 value,
 icon: Icon,
 color,
 delay,
 compact
}: StatCardProps) {
 return (
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6, delay }}
   >
     <Card className={`p-6 ${compact ? 'bg-white/50 backdrop-blur-sm' : ''}`}>
       <div className="flex items-center gap-4">
         <div className={`${color} p-3 rounded-lg bg-white/50`}>
           <Icon className="w-6 h-6" />
         </div>
         <div>
           <p className="text-sm text-gray-600 dark:text-gray-400">
             {label}
           </p>
           <p className="text-2xl font-bold">{value}</p>
         </div>
       </div>
     </Card>
   </motion.div>
 );
});

const SkeletonStats = ({ compact }: { compact?: boolean }) => (
 <div className={`grid ${compact ? 'grid-cols-3' : 'md:grid-cols-3'} gap-4`}>
   {[...Array(3)].map((_, i) => (
     <SkeletonCard key={i} />
   ))}
 </div>
);