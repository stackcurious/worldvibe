// @ts-nocheck
// src/components/trends/emotion-trends.tsx
"use client";
import { memo, useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { fetchEmotionTrends } from '@/lib/api';
import { EMOTION_COLORS } from '@/config/constants';

export const EmotionTrends = memo(function EmotionTrends() {
 const { theme } = useTheme();
 const [timeRange, setTimeRange] = useState('24h');

 const { data, isLoading } = useQuery({
   queryKey: ['emotion-trends', timeRange],
   queryFn: () => fetchEmotionTrends(timeRange),
   refetchInterval: 60000, // 1 minute
   staleTime: 30000 // 30 seconds
 });

 const chartData = useMemo(() => 
   data?.map(emotion => ({
     id: emotion.name,
     color: EMOTION_COLORS[emotion.name],
     data: emotion.points.map(point => ({
       x: point.timestamp,
       y: point.value
     }))
   })) ?? [], [data]
 );

 return (
   <Card className="p-6">
     <div className="flex justify-between items-center mb-6">
       <h2 className="text-xl font-semibold">Emotion Trends</h2>
       <Select
         value={timeRange}
         onValueChange={setTimeRange}
         options={[
           { value: '24h', label: 'Last 24 Hours' },
           { value: '7d', label: 'Last 7 Days' },
           { value: '30d', label: 'Last 30 Days' }
         ]}
       />
     </div>

     <div className="h-[400px]">
       <ResponsiveLine
         data={chartData}
         margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
         xScale={{
           type: 'time',
           format: '%Y-%m-%dT%H:%M:%S',
           useUTC: false,
           precision: 'minute'
         }}
         xFormat="time:%H:%M"
         yScale={{
           type: 'linear',
           min: 0,
           max: 'auto'
         }}
         axisLeft={{
           tickSize: 5,
           tickPadding: 5,
           format: value => `${value}%`
         }}
         axisBottom={{
           format: '%H:%M',
           tickRotation: -45
         }}
         enableGridX={false}
         enablePoints={false}
         useMesh={true}
         enableSlices="x"
         curve="monotoneX"
         theme={{
           textColor: theme === 'dark' ? '#fff' : '#333',
           grid: {
             line: {
               stroke: theme === 'dark' ? '#333' : '#eee'
             }
           }
         }}
         animate={false}
         motionConfig="gentle"
         legends={[
           {
             anchor: 'top-right',
             direction: 'column',
             justify: false,
             translateX: 100,
             translateY: 0,
             itemsSpacing: 0,
             itemDirection: 'left-to-right',
             itemWidth: 80,
             itemHeight: 20,
             symbolSize: 12,
             symbolShape: 'circle'
           }
         ]}
         sliceTooltip={({ slice }) => (
           <div className="bg-white dark:bg-gray-800 p-2 shadow rounded">
             <div className="text-sm font-medium">
               {slice.points[0].data.xFormatted}
             </div>
             {slice.points.map(point => (
               <div
                 key={point.id}
                 className="flex items-center gap-2 text-sm"
               >
                 <div
                   className="w-2 h-2 rounded-full"
                   style={{ backgroundColor: point.serieColor }}
                 />
                 <span>{point.serieId}:</span>
                 <span className="font-medium">{point.data.yFormatted}%</span>
               </div>
             ))}
           </div>
         )}
       />
     </div>
   </Card>
 );
});