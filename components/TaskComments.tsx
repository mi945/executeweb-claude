'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import { id } from '@instantdb/react';

interface Comment {
  id: string;
  text: string;
  createdAt: number;
  mentionedUser?: string;
  author: {
    id: string;
    name?: string;
  };
  replies?: Comment[];
  parentComment?: {
    id: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
  compact?: boolean;
}

export default function TaskComments({ taskId, compact = false }: TaskCommentsProps) {
  const { user } = db.useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorName: string; isLevel1: boolean } | null>(null);

  // Query comments with nested replies and authors
  const { data } = db.useQuery({
    comments: {
      task: {},
      author: {},
      replies: {
        author: {},
      },
      parentComment: {},
    },
  });

  // Get user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const userProfile = profileData?.profiles?.find((p: any) => p.id === user?.id);

  // Filter and organize comments for this specific task
  const allComments = ((data?.comments || []) as any[]).filter((c) => c.task?.id === taskId);

  // Separate parent comments from replies
  const parentComments = allComments
    .filter((c) => !c.parentComment?.id)
    .map((c) => ({
      ...c,
      replies: allComments.filter((reply) => reply.parentComment?.id === c.id),
    }))
    .sort((a, b) => b.createdAt - a.createdAt) as Comment[];

  const totalComments = allComments.length;
  const displayedComments = showAllComments ? parentComments : parentComments.slice(0, 2);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !userProfile) {
      return;
    }

    setIsSubmitting(true);
    const commentId = id();

    try {
      const transactions: any[] = [
        // Create comment
        db.tx.comments[commentId].update({
          text: commentText.trim(),
          createdAt: Date.now(),
          mentionedUser: replyingTo?.isLevel1 ? replyingTo.authorName : undefined,
        }),
        // Link to task
        db.tx.tasks[taskId].link({ comments: commentId }),
        // Link to author
        db.tx.profiles[userProfile.id].link({ comments: commentId }),
      ];

      // If replying, link to parent comment
      if (replyingTo) {
        transactions.push(
          db.tx.comments[replyingTo.commentId].link({ replies: commentId })
        );
      }

      await db.transact(transactions);

      setCommentText('');
      setReplyingTo(null);
    } catch (err: any) {
      alert('Error posting comment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, authorName: string, isLevel1: boolean) => {
    setReplyingTo({ commentId, authorName, isLevel1 });

    // Auto-populate @mention for reply-to-reply
    if (isLevel1) {
      setCommentText(`@${authorName} `);
    } else {
      setCommentText('');
    }
  };

  const toggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const CommentItem = ({ comment, isReply = false, isLastReply = false }: { comment: Comment; isReply?: boolean; isLastReply?: boolean }) => {
    const threadExpanded = expandedThreads.has(comment.id);
    const replyCount = comment.replies?.length || 0;
    const displayedReplies = threadExpanded ? comment.replies : comment.replies?.slice(0, 2);

    return (
      <div className={isReply ? 'relative' : ''}>
        {/* Thread Line for Replies */}
        {isReply && (
          <div
            className="absolute left-2 top-0 w-0.5 bg-gray-200"
            style={{ height: isLastReply ? '20px' : 'calc(100% + 12px)' }}
          />
        )}

        <div className={`flex gap-3 ${isReply ? 'pl-8' : ''}`}>
          {/* Avatar */}
          <div
            className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gradient-to-br ${
              isReply ? 'from-gray-300 to-gray-400' : 'from-purple-400 to-blue-500'
            } flex items-center justify-center text-white font-bold flex-shrink-0`}
            style={{ fontSize: isReply ? '0.6rem' : '0.75rem' }}
          >
            {comment.author?.name?.charAt(0).toUpperCase() || '?'}
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-xs text-gray-900">
                {comment.author?.name || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-400">
                {getTimeAgo(comment.createdAt)}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-0.5 break-words">
              {comment.mentionedUser && (
                <span className="text-blue-600 font-semibold">@{comment.mentionedUser} </span>
              )}
              {comment.text}
            </p>

            {/* Reply Button */}
            <button
              onClick={() => handleReply(comment.id, comment.author?.name || 'Anonymous', isReply)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 mt-1 transition-colors"
            >
              Reply
            </button>
          </div>
        </div>

        {/* Nested Replies */}
        {replyCount > 0 && (
          <div className="mt-3 space-y-3">
            <AnimatePresence>
              {displayedReplies?.map((reply, index) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CommentItem
                    comment={reply}
                    isReply
                    isLastReply={index === displayedReplies.length - 1 && (!threadExpanded || replyCount <= 2)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* View More Replies Toggle */}
            {replyCount > 2 && (
              <button
                onClick={() => toggleThread(comment.id)}
                className="pl-8 text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                {threadExpanded ? (
                  <>
                    Hide replies
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    View {replyCount - 2} more {replyCount - 2 === 1 ? 'reply' : 'replies'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (totalComments === 0 && !userProfile) {
    return null; // Don't show anything if no comments and user not logged in
  }

  return (
    <div className={compact ? '' : 'border-t border-gray-100 pt-3'}>
      {/* Teaser View: Show comment count or expand link */}
      {totalComments > 0 && (
        <>
          {!showAllComments && totalComments > 2 && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 mb-3 transition-colors"
            >
              View all {totalComments} comments
            </button>
          )}

          {/* Comments List */}
          <div className="space-y-4 mb-3">
            <AnimatePresence>
              {displayedComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <CommentItem comment={comment} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {showAllComments && totalComments > 2 && (
            <button
              onClick={() => setShowAllComments(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 mb-3 transition-colors"
            >
              Show less
            </button>
          )}
        </>
      )}

      {/* Comment Input - Only show if user is logged in */}
      {userProfile && (
        <div className="mt-3">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
              <span>
                Replying to <span className="font-semibold">@{replyingTo.authorName}</span>
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setCommentText('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex gap-2 items-start">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-purple-400 focus:outline-none transition-colors"
                disabled={isSubmitting}
              />
              <motion.button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                whileHover={commentText.trim() ? { scale: 1.05 } : {}}
                whileTap={commentText.trim() ? { scale: 0.95 } : {}}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  commentText.trim()
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '...' : 'Post'}
              </motion.button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
