'use client';

import { motion } from 'framer-motion';

interface ExecutionBlockProps {
  externalLink?: string;
  hasExecuted: boolean;
  hasCompleted: boolean;
  isLoading: boolean;
  onExecute: () => void;
}

export default function ExecutionBlock({
  externalLink,
  hasExecuted,
  hasCompleted,
  isLoading,
  onExecute,
}: ExecutionBlockProps) {
  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getButtonState = () => {
    if (hasCompleted) {
      return {
        text: 'Completed',
        className: 'bg-green-500 text-white cursor-default',
        icon: '✓',
      };
    }
    if (hasExecuted) {
      return {
        text: 'In Progress',
        className: 'bg-yellow-500 text-white',
        icon: '◐',
      };
    }
    return {
      text: 'Execute',
      className: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105',
      icon: '▶',
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="flex items-center justify-between py-4 border-t border-gray-100">
      {/* Link Chip */}
      {externalLink ? (
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors group"
        >
          <svg
            className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span>{getDomain(externalLink)}</span>
          <svg
            className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      ) : (
        <div />
      )}

      {/* Execute Button */}
      <motion.button
        whileHover={!hasCompleted ? { scale: 1.02 } : {}}
        whileTap={!hasCompleted ? { scale: 0.98 } : {}}
        onClick={!hasCompleted ? onExecute : undefined}
        disabled={isLoading || hasCompleted}
        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${buttonState.className} ${
          isLoading ? 'opacity-70' : ''
        }`}
      >
        {isLoading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <span className="text-sm">{buttonState.icon}</span>
        )}
        <span>{buttonState.text}</span>
      </motion.button>
    </div>
  );
}
