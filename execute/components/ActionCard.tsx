'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getRelativeTime } from '@/lib/time';
import { useTaskPresence } from '@/hooks/useTaskPresence';
import LivePresenceBar from './LivePresenceBar';
import WallOfFame from './WallOfFame';
import ExecutionBlock from './ExecutionBlock';
import TaskComments from './TaskComments';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  createdAt: number;
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
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
  isExecuting: boolean;
}

export default function ActionCard({
  task,
  userProfile,
  currentUserId,
  onExecute,
  isExecuting,
}: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Check execution status for current user
  const userExecution = task.executions?.find((e) => e.user?.id === currentUserId);
  const hasExecuted = !!userExecution;
  const hasCompleted = userExecution?.completed ?? false;

  // Use presence for this task - only if user is executing and hasn't completed
  const { activePresences } = useTaskPresence({
    taskId: task.id,
    userProfile,
    isExecuting: hasExecuted && !hasCompleted,
  });

  // Determine if description needs expansion
  const descriptionNeedsExpansion = task.description.length > 120;

  // Comment count
  const commentCount = 0; // Will be fetched in TaskComments

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      {/* Image Header (optional) */}
      {task.imageUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Identity Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${task.creator?.id}`}>
            {task.creator?.profileImage ? (
              <img
                src={task.creator.profileImage}
                alt={task.creator.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {task.creator?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${task.creator?.id}`}
              className="font-bold text-gray-900 hover:text-purple-600 transition-colors"
            >
              {task.creator?.name || 'Anonymous'}
            </Link>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">
              {getRelativeTime(task.createdAt)}
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h2>

        {/* Description with fade effect */}
        <div className="relative mb-4">
          <p
            className={`text-gray-600 leading-relaxed ${
              !expanded && descriptionNeedsExpansion ? 'line-clamp-3' : ''
            }`}
          >
            {task.description}
          </p>
          {!expanded && descriptionNeedsExpansion && (
            <>
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              <button
                onClick={() => setExpanded(true)}
                className="relative text-purple-600 font-medium text-sm hover:text-purple-700 transition-colors mt-1"
              >
                See More
              </button>
            </>
          )}
          {expanded && descriptionNeedsExpansion && (
            <button
              onClick={() => setExpanded(false)}
              className="text-purple-600 font-medium text-sm hover:text-purple-700 transition-colors mt-2"
            >
              See Less
            </button>
          )}
        </div>

        {/* Live Presence Bar */}
        <LivePresenceBar activePresences={activePresences} />

        {/* Execution Block */}
        <ExecutionBlock
          externalLink={task.externalLink}
          hasExecuted={hasExecuted}
          hasCompleted={hasCompleted}
          isLoading={isExecuting}
          onExecute={() => onExecute(task.id)}
        />

        {/* Wall of Fame */}
        <WallOfFame executions={task.executions || []} />
      </div>

      {/* Social Layer (Detached Comments) */}
      <div className="bg-slate-50 border-t border-gray-200">
        <div className="p-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{showComments ? 'Hide comments' : 'View comments'}</span>
          </button>
        </div>

        {showComments && (
          <div className="px-4 pb-4">
            <TaskComments taskId={task.id} compact />
          </div>
        )}
      </div>
    </motion.article>
  );
}
