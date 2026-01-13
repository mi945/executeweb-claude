'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import { id } from '@instantdb/react';

interface Comment {
  id: string;
  text: string;
  createdAt: number;
  author: {
    id: string;
    name?: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = db.useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Query comments for this task
  const { data } = db.useQuery({
    comments: {
      task: {},
      author: {},
    },
  });

  // Get user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const userProfile = profileData?.profiles?.find((p: any) => p.id === user?.id);

  // Filter comments for this specific task
  const taskComments = ((data?.comments || []) as any[])
    .filter((c) => c.task?.id === taskId)
    .sort((a, b) => b.createdAt - a.createdAt) as Comment[];

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !userProfile) {
      return;
    }

    setIsSubmitting(true);
    const commentId = id();

    try {
      await db.transact([
        // Create comment
        db.tx.comments[commentId].update({
          text: commentText.trim(),
          createdAt: Date.now(),
        }),
        // Link to task
        db.tx.tasks[taskId].link({ comments: commentId }),
        // Link to author
        db.tx.profiles[userProfile.id].link({ comments: commentId }),
      ]);

      setCommentText('');
      setShowComments(true);
    } catch (err: any) {
      alert('Error posting comment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      {/* Comments Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-3 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {taskComments.length > 0 ? `${taskComments.length} comments` : 'Add comment'}
        <svg
          className={`w-4 h-4 transition-transform ${showComments ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Comment Input */}
            {userProfile && (
              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {userProfile?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none text-sm"
                      rows={2}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-end mt-2">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting || !commentText.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Posting...' : 'Post'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {taskComments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 text-gray-400 text-sm"
                  >
                    No comments yet. Be the first!
                  </motion.div>
                ) : (
                  taskComments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-2"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {comment.author?.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
