// src/components/home/welcome-hero.tsx
"use client";
import { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/use-analytics';
import { GlobalStats } from './global-stats';

export const WelcomeHero = memo(function WelcomeHero() {
 const { ref, inView } = useInView({
   triggerOnce: true,
   threshold: 0.1
 });

 const { trackEvent } = useAnalytics();

 const handleGetStarted = () => {
   trackEvent('hero_cta_click');
 };

 return (
   <section 
     ref={ref}
     className="relative py-20 overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"
   >
     <motion.div
       className="container mx-auto px-4"
       initial={{ opacity: 0, y: 20 }}
       animate={inView ? { opacity: 1, y: 0 } : {}}
       transition={{ duration: 0.6 }}
     >
       <div className="max-w-3xl mx-auto text-center">
         <motion.h1 
           className="text-4xl md:text-6xl font-bold mb-6"
           initial={{ opacity: 0, y: 20 }}
           animate={inView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.6, delay: 0.2 }}
         >
           Track the World's{' '}
           <span className="text-blue-600 dark:text-blue-400">
             Emotional Pulse
           </span>
         </motion.h1>

         <motion.p
           className="text-xl text-gray-600 dark:text-gray-300 mb-8"
           initial={{ opacity: 0, y: 20 }}
           animate={inView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.6, delay: 0.4 }}
         >
           Join millions in sharing how you feel and discover global emotional trends in real-time.
         </motion.p>

         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={inView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.6, delay: 0.6 }}
         >
           <Button 
             size="lg" 
             onClick={handleGetStarted}
             className="shadow-lg hover:shadow-xl transition-shadow"
           >
             Share Your Vibe
           </Button>
         </motion.div>
       </div>

       <motion.div
         className="mt-16"
         initial={{ opacity: 0, y: 20 }}
         animate={inView ? { opacity: 1, y: 0 } : {}}
         transition={{ duration: 0.6, delay: 0.8 }}
       >
         <GlobalStats compact />
       </motion.div>
     </motion.div>

     {/* Background Elements */}
     <div className="absolute inset-0 overflow-hidden pointer-events-none">
       <div className="absolute -top-1/2 -right-1/2 w-full h-full transform rotate-45 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full" />
       <div className="absolute -bottom-1/2 -left-1/2 w-full h-full transform -rotate-45 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/20 dark:to-blue-900/20 rounded-full" />
     </div>
   </section>
 );
});

