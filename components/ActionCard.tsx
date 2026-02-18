'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getRelativeTime } from '@/lib/time';
import { useTaskPresence } from '@/hooks/useTaskPresence';
import TaskComments from './TaskComments';
import Link from 'next/link';
import db from '@/lib/db';

interface Task {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  createdAt: number;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
    avatarColor?: string;
  };
  executions?: Array<{
    id: string;
    user: { id: string; name?: string; profileImage?: string };
    completed: boolean;
    completedAt?: number;
  }>;
}

interface ActionCardProps {
  task: Task;
  userProfile: {
    id: string;
    name: string;
    profileImage?: string;
  } | null;
  currentUserId?: string;
  onExecute: (taskId: string) => void;
  onComplete?: (executionId: string) => void;
  isExecuting: boolean;
  isCompleting?: boolean;
  onClick?: (task: Task) => void;
  showCelebration?: boolean;
}

export default function ActionCard({
  task,
  userProfile,
  currentUserId,
  onExecute,
  onComplete,
  isExecuting,
  isCompleting,
  onClick,
  showCelebration,
}: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Query comments for this task
  const { data: commentsData } = db.useQuery({
    comments: {
      task: {},
    },
  });

  // Count comments for this task
  const commentCount = (commentsData?.comments || []).filter(
    (c: any) => c.task?.id === task.id
  ).length;

  // Check execution status for current user
  const userExecution = task.executions?.find((e) => e.user?.id === currentUserId);
  const hasExecuted = !!userExecution;
  const hasCompleted = userExecution?.completed ?? false;
  const executionId = userExecution?.id;

  // Use presence for this task
  const { activePresences } = useTaskPresence({
    taskId: task.id,
    userProfile,
    isExecuting: hasExecuted && !hasCompleted,
  });

  // Determine if description needs expansion (shorter threshold for compact)
  const descriptionNeedsExpansion = task.description.length > 100;

  // Get completed executions for wall of fame
  const completers = (task.executions || [])
    .filter((e) => e.completed && e.user)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 5);

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Button state
  const getButtonState = () => {
    if (hasCompleted) return { text: 'Done', class: 'bg-green-500 text-white', icon: '✓', disabled: true };
    if (hasExecuted) return { text: 'Mark Done', class: 'bg-amber-500 hover:bg-green-500 text-white hover:shadow-md', icon: '✓', disabled: false };
    return { text: 'Execute', class: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-md', icon: '▶', disabled: false };
  };
  const btnState = getButtonState();

  // Handle button click based on state
  const handleButtonClick = () => {
    if (hasCompleted) return; // Already completed, do nothing
    if (hasExecuted && onComplete && executionId) {
      // Mark as complete
      onComplete(executionId);
    } else if (!hasExecuted) {
      // Execute the task
      onExecute(task.id);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={(e) => {
        // Only trigger onClick if the click is on the card itself, not on interactive elements
        const target = e.target as HTMLElement;
        if (
          onClick &&
          !target.closest('button') &&
          !target.closest('a') &&
          !target.closest('input')
        ) {
          onClick(task);
        }
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Compact Image (optional) */}
      {task.imageUrl && (
        <div className="h-32 relative overflow-hidden bg-gray-100">
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Compact Header Row: Avatar + Name + Time + Link */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={`/profile/${task.creator?.id}`} className="flex-shrink-0">
              {task.creator?.profileImage ? (
                <img
                  src={task.creator.profileImage}
                  alt={task.creator.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${task.creator?.avatarColor || 'from-purple-400 to-blue-500'} flex items-center justify-center text-white text-xs font-bold`}>
                  {task.creator?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <Link
              href={`/profile/${task.creator?.id}`}
              className="font-semibold text-sm text-gray-900 hover:text-purple-600 truncate"
            >
              {task.creator?.name || 'Anonymous'}
            </Link>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-gray-400 text-xs flex-shrink-0">
              {getRelativeTime(task.createdAt)}
            </span>
          </div>

          {/* Link chip (compact) */}
          {task.externalLink && (
            <a
              href={task.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors flex-shrink-0 ml-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="max-w-[80px] truncate">{getDomain(task.externalLink)}</span>
            </a>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{task.title}</h2>

        {/* Event Details (if present) */}
        {(task.eventDate || task.eventTime || task.eventLocation) && (
          <div className="flex flex-wrap items-center gap-3 mb-2 text-slate-500 text-sm">
            {task.eventDate && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(task.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {task.eventTime && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{task.eventTime}</span>
              </div>
            )}
            {task.eventLocation && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-[200px]">{task.eventLocation}</span>
              </div>
            )}
          </div>
        )}

        {/* Description (compact with 2-line clamp) */}
        <div className="relative mb-3">
          <p
            className={`text-sm text-gray-600 leading-snug ${
              !expanded && descriptionNeedsExpansion ? 'line-clamp-2' : ''
            }`}
          >
            {task.description}
          </p>
          {descriptionNeedsExpansion && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-600 font-medium text-xs hover:text-purple-700 mt-0.5"
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
        </div>

        {/* Action Row: Presence + Stats + Execute Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Active Users Presence */}
            {activePresences.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {activePresences.slice(0, 3).map((user, i) => (
                    <div
                      key={user.peerId}
                      style={{ zIndex: 3 - i }}
                      className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {user.odocAvatar ? (
                        <img src={user.odocAvatar} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.odocName?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {activePresences.length} active
                </span>
              </div>
            )}

            {/* Completers (Wall of Fame inline) */}
            {completers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {completers.slice(0, 3).map((exec, i) => (
                    <div
                      key={exec.id}
                      style={{ zIndex: 3 - i }}
                      className="w-5 h-5 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold"
                      title={exec.user?.name}
                    >
                      {exec.user?.profileImage ? (
                        <img src={exec.user.profileImage} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        exec.user?.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {task.executions?.filter(e => e.completed).length || 0} done
                </span>
              </div>
            )}

            {/* Fallback: show completion count if no completers yet */}
            {completers.length === 0 && (
              <span className="text-xs text-gray-400">
                {task.executions?.length || 0} started
              </span>
            )}
          </div>

          {/* Execute/Complete Button */}
          <motion.button
            whileHover={!btnState.disabled ? { scale: 1.02 } : {}}
            whileTap={!btnState.disabled ? { scale: 0.98 } : {}}
            onClick={!btnState.disabled ? handleButtonClick : undefined}
            disabled={isExecuting || isCompleting || btnState.disabled}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${btnState.class} ${
              isExecuting || isCompleting ? 'opacity-70' : ''
            }`}
          >
            {isExecuting || isCompleting ? (
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span className="text-xs">{btnState.icon}</span>
            )}
            <span>{btnState.text}</span>
          </motion.button>
        </div>

        {/* Celebration Message */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-400 rounded-full">
              <span className="text-green-600 font-bold animate-bounce">✓</span>
              <span className="text-green-700 font-semibold">Task completed! Keep going!</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Social Layer (Collapsed by default) */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-purple-600 hover:bg-gray-100/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>
            {showComments ? 'Hide' : commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : 'Comments'}
          </span>
        </button>

        {showComments && (
          <div className="px-4 pb-3 border-t border-gray-100">
            <TaskComments taskId={task.id} compact />
          </div>
        )}
      </div>
    </motion.article>
  );
}
