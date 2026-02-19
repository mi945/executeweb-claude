'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onUndo?: () => void;
  onDismiss: () => void;
  duration?: number; // milliseconds
  type?: 'success' | 'info' | 'warning' | 'error';
}

export default function Toast({
  message,
  isVisible,
  onUndo,
  onDismiss,
  duration = 15000, // 15 seconds - optimal for undo actions
  type = 'success',
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  const typeStyles = {
    success: 'bg-green-600 border-green-700',
    info: 'bg-blue-600 border-blue-700',
    warning: 'bg-amber-600 border-amber-700',
    error: 'bg-red-600 border-red-700',
  };

  const iconPaths = {
    success: 'M5 13l4 4L19 7',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="fixed bottom-20 right-4 z-50 max-w-md w-full sm:w-auto"
        >
          <div
            className={`${typeStyles[type]} text-white rounded-xl shadow-2xl border-2 flex items-center gap-3 p-4 min-w-[320px]`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d={iconPaths[type]}
                />
              </svg>
            </div>

            {/* Message */}
            <p className="flex-1 font-medium text-sm">{message}</p>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onUndo && (
                <button
                  onClick={() => {
                    onUndo();
                    onDismiss();
                  }}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                >
                  Undo
                </button>
              )}
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {duration > 0 && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className="h-1 bg-white/40 rounded-full mt-1"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
