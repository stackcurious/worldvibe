// @ts-nocheck
"use client";
import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
 id: string;
 type: ToastType;
 message: string;
 duration?: number;
 onClose: () => void;
}

const icons = {
 success: CheckCircle,
 error: XCircle,
 warning: AlertCircle,
 info: Info
};

const colors = {
 success: 'bg-green-50 border-green-200 text-green-800',
 error: 'bg-red-50 border-red-200 text-red-800',
 warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
 info: 'bg-blue-50 border-blue-200 text-blue-800'
};

export const Toast = memo(function Toast({
 id,
 type,
 message,
 duration = 5000,
 onClose
}: ToastProps) {
 const Icon = icons[type];

 useEffect(() => {
   if (duration) {
     const timer = setTimeout(onClose, duration);
     return () => clearTimeout(timer);
   }
 }, [duration, onClose]);

 return (
   <motion.div
     initial={{ opacity: 0, y: 50, scale: 0.3 }}
     animate={{ opacity: 1, y: 0, scale: 1 }}
     exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
     className={`
       fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3
       rounded-lg border shadow-lg ${colors[type]}
     `}
   >
     <Icon className="w-5 h-5" />
     <p className="text-sm font-medium">{message}</p>
     <button
       onClick={onClose}
       className="ml-4 hover:opacity-70 transition-opacity"
       aria-label="Close notification"
     >
       <XCircle className="w-4 h-4" />
     </button>
   </motion.div>
 );
});