'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  externalLink?: string | null;
  createdAt: number;
  creator?: {
    id: string;
    name?: string;
    profileImage?: string | null;
  };
  executions?: Array<{
    id: string;
    completed: boolean;
    user: {
      id: string;
      name?: string;
      profileImage?: string | null;
    };
  }>;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  activeUsers?: Array<{ userId: string; userName?: string; profileImage?: string }>;
}

export default function TaskDetailModal({ task, isOpen, onClose, activeUsers = [] }: TaskDetailModalProps) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!task) return null;

  const completers = task.executions?.filter(e => e.completed) || [];
  const linkDomain = task.externalLink ? new URL(task.externalLink).hostname.replace('www.', '') : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Header Image */}
                {task.imageUrl && (
                  <div className="w-full h-64 rounded-xl overflow-hidden">
                    <img
                      src={task.imageUrl}
                      alt={task.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Creator Info */}
                <div className="flex items-center gap-3">
                  {task.creator?.profileImage ? (
                    <img
                      src={task.creator.profileImage}
                      alt={task.creator.name || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                      {(task.creator?.name || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{task.creator?.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {task.title}
                </h1>

                {/* External Link */}
                {task.externalLink && (
                  <a
                    href={task.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-medium">🔗 {linkDomain}</span>
                  </a>
                )}

                {/* Description */}
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Activity Section */}
                <div className="space-y-4">
                  {/* Active Users */}
                  {activeUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Currently Working On This</h3>
                      <div className="flex flex-wrap gap-3">
                        {activeUsers.map((user) => (
                          <div key={user.userId} className="flex items-center gap-2">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.userName || 'User'}
                                className="w-10 h-10 rounded-full border-2 border-amber-300 ring-2 ring-amber-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold border-2 border-amber-300">
                                {(user.userName || 'A')[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{user.userName || 'Anonymous'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completers Wall of Fame */}
                  {completers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Wall of Fame ({completers.length})</h3>
                      <div className="flex flex-wrap gap-3">
                        {completers.slice(0, 10).map((execution) => (
                          <div key={execution.id} className="flex items-center gap-2">
                            {execution.user.profileImage ? (
                              <img
                                src={execution.user.profileImage}
                                alt={execution.user.name || 'User'}
                                className="w-10 h-10 rounded-full border-2 border-green-300 ring-2 ring-green-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold border-2 border-green-300">
                                {(execution.user.name || 'A')[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{execution.user.name || 'Anonymous'}</span>
                          </div>
                        ))}
                        {completers.length > 10 && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                            +{completers.length - 10}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
