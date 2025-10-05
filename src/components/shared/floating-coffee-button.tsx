'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Heart } from 'lucide-react';

export function FloatingCoffeeButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show after scrolling 300px down
      const shouldShow = scrollY > 300;
      
      // Hide when near bottom (to avoid footer overlap)
      const isNearBottom = scrollY + windowHeight >= documentHeight - 200;
      
      setIsVisible(shouldShow && !isNearBottom);
      setHasScrolled(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href="https://buymeacoffee.com/vibemaster"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-40 group"
          initial={{ scale: 0, opacity: 0, x: -50 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: -50 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20,
            delay: 0.2
          }}
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            {/* Pulsing glow effect */}
            <motion.div 
              className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Button */}
            <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-3 shadow-2xl flex items-center gap-2 group-hover:shadow-yellow-400/25 transition-all duration-300">
              <Coffee className="w-5 h-5" />
              <motion.span 
                className="hidden group-hover:inline-block font-semibold text-sm pr-2 whitespace-nowrap"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                Buy me a coffee
              </motion.span>
            </div>

            {/* Floating hearts animation */}
            <AnimatePresence>
              {hasScrolled && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ 
                    scale: [0, 1, 0.8, 1],
                    rotate: [0, 10, -10, 0],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                >
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
