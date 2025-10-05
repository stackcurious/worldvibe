"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Bell, X } from "lucide-react";

export function ReminderNotification() {
  const searchParams = useSearchParams();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    if (message === 'email-verified') {
      setNotification({
        type: 'success',
        title: 'You\'re all set! 🎉',
        message: 'We\'ll send you a daily reminder to check in and share your vibe with the world.',
      });
    } else if (message === 'already-verified') {
      setNotification({
        type: 'info',
        title: 'Already verified',
        message: 'Your email has already been verified. You\'ll continue receiving daily reminders.',
      });
    } else if (message === 'unsubscribed') {
      setNotification({
        type: 'info',
        title: 'Unsubscribed',
        message: 'You\'ve been unsubscribed from daily reminders. We\'ll miss you! You can always sign up again.',
      });
    } else if (error === 'invalid-token') {
      setNotification({
        type: 'error',
        title: 'Invalid link',
        message: 'This verification link is invalid or has expired. Please sign up again.',
      });
    } else if (error === 'verification-failed') {
      setNotification({
        type: 'error',
        title: 'Verification failed',
        message: 'Something went wrong. Please try again or contact support.',
      });
    } else if (error === 'unsubscribe-failed') {
      setNotification({
        type: 'error',
        title: 'Unsubscribe failed',
        message: 'Something went wrong while unsubscribing. Please try again.',
      });
    }

    // Auto-dismiss after 8 seconds
    if (message || error) {
      const timer = setTimeout(() => {
        setNotification(null);
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleClose = () => {
    setNotification(null);
    // Clean up URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('message');
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
  };

  const getIcon = () => {
    switch (notification?.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'info':
        return <Bell className="w-6 h-6 text-blue-400" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (notification?.type) {
      case 'success':
        return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'error':
        return 'from-red-500/20 to-rose-500/20 border-red-400/30';
      case 'info':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className={`bg-gradient-to-r ${getBackgroundColor()} backdrop-blur-xl rounded-2xl p-6 border shadow-2xl`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getIcon()}
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">
                  {notification.title}
                </h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {notification.message}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl overflow-hidden"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: "linear" }}
            >
              <div className="h-full bg-white/60" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
