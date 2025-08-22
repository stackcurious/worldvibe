// src/components/ads/activity-recommendation.tsx
"use client";
import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { fetchRecommendations } from '@/lib/api';
import { useAnalytics } from '@/hooks/use-analytics';

interface ActivityRecommendationProps {
 emotion: string;
 intensity: number;
 region?: string;
}

export const ActivityRecommendation = memo(function ActivityRecommendation({
 emotion,
 intensity,
 region
}: ActivityRecommendationProps) {
 const { trackEvent } = useAnalytics();

 const { data: activities } = useQuery({
   queryKey: ['recommendations', emotion, intensity, region],
   queryFn: () => fetchRecommendations({ emotion, intensity, region }),
   staleTime: 300000, // 5 minutes
 });

 const handleActivityClick = (activity: string) => {
   trackEvent('activity_click', {
     activity,
     emotion,
     intensity,
     region
   });
 };

 return (
   <Card className="overflow-hidden">
     <div className="p-6 space-y-4">
       <h3 className="text-lg font-medium">
         Recommended for your mood
       </h3>
       
       <div className="grid gap-4">
         <AnimatePresence mode="wait">
           {activities?.map((activity, index) => (
             <motion.div
               key={activity.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ delay: index * 0.1 }}
             >
               <button
                 onClick={() => handleActivityClick(activity.name)}
                 className="w-full text-left"
               >
                 <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                   <h4 className="font-medium">{activity.name}</h4>
                   <p className="text-sm text-gray-600 dark:text-gray-300">
                     {activity.description}
                   </p>
                 </Card>
               </button>
             </motion.div>
           ))}
         </AnimatePresence>
       </div>
     </div>
   </Card>
 );
});