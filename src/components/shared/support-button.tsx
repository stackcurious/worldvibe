'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Coffee, DollarSign, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Support Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative">
          {/* Pulsing glow */}
          <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />

          {/* Button */}
          <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full p-4 shadow-2xl flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white" />
            <span className="hidden group-hover:inline-block font-semibold text-sm pr-2 whitespace-nowrap">
              Support Us
            </span>
          </div>
        </div>
      </motion.button>

      {/* Support Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
            >
              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 border border-white/20 shadow-2xl">
                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-4"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Heart className="w-8 h-8 text-white fill-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white mb-2">
                    Love WorldVibe?
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Help us keep the world's emotional pulse beating
                  </p>
                </div>

                {/* Why support */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
                  <div className="space-y-3 text-sm text-gray-200">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">100% Free Forever</strong>
                        <p className="text-gray-300">No ads, no paywalls, no premium tiers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Sustainability</strong>
                        <p className="text-gray-300">Your support covers servers & development</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Community-Powered</strong>
                        <p className="text-gray-300">Built with love, sustained by you</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donation options */}
                <div className="space-y-3">
                  {/* Buy Me a Coffee */}
                  <a
                    href="https://www.buymeacoffee.com/worldvibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:shadow-xl transition-shadow cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <Coffee className="w-6 h-6 text-white" />
                        <div className="text-left">
                          <div className="font-bold text-white">Buy Me a Coffee</div>
                          <div className="text-xs text-white/80">One-time support</div>
                        </div>
                      </div>
                      <div className="text-2xl">☕</div>
                    </motion.div>
                  </a>

                  {/* Ko-fi */}
                  <a
                    href="https://ko-fi.com/worldvibe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:shadow-xl transition-shadow cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 text-white fill-white" />
                        <div className="text-left">
                          <div className="font-bold text-white">Ko-fi</div>
                          <div className="text-xs text-white/80">Support via Ko-fi</div>
                        </div>
                      </div>
                      <div className="text-2xl">💙</div>
                    </motion.div>
                  </a>

                  {/* GitHub Sponsors */}
                  <a
                    href="https://github.com/sponsors/stackcurious"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <motion.div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl transition-shadow cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-white" />
                        <div className="text-left">
                          <div className="font-bold text-white">GitHub Sponsors</div>
                          <div className="text-xs text-white/80">Monthly or one-time</div>
                        </div>
                      </div>
                      <div className="text-2xl">💖</div>
                    </motion.div>
                  </a>
                </div>

                {/* Footer message */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-300">
                    Every contribution helps keep WorldVibe free and ad-free for everyone 💫
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
