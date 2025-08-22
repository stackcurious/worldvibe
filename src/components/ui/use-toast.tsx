"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// Toast types
export type ToastVariant =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | null>(null);

// Generate unique IDs
const generateId = () => `toast-${Math.random().toString(36).slice(2, 11)}`;

// Provide context
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add a new toast
  const toast = useCallback((params: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      variant: 'default',
      duration: 5000,
      ...params,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after the specified duration if not Infinity
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
  }, []);

  // Dismiss a specific toast
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use the toast functionality
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container to render all active toasts
function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 max-h-screen overflow-hidden flex flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismiss(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual toast component
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = {
    default: 'bg-white',
    success: 'bg-green-50 text-green-900 border-green-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    destructive: 'bg-red-100 text-red-900 border-red-300',
  }[toast.variant || 'default'];

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        'max-w-md w-full rounded-lg shadow-lg border p-4',
        'flex items-start gap-2',
        bgColor,
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      )}
    >
      <div className="flex-1">
        {toast.title && <h4 className="font-medium text-sm">{toast.title}</h4>}
        {toast.description && (
          <p className="text-sm mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}
