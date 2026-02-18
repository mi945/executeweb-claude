'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import CreatorMetadata from './CreatorMetadata';
import ProofUploadModal from './ProofUploadModal';
import { useChallengeInvites } from '@/hooks/useChallengeInvites';

interface Execution {
  id: string;
  executedAt: number;
  completed: boolean;
  completedAt?: number;
  task: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    createdAt: number;
    creator?: {
      id: string;
      name: string;
      profileImage?: string;
    };
  };
}

export default function ActionDrawer() {
  const { user } = db.useAuth();
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [processingChallengeId, setProcessingChallengeId] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [pendingExecution, setPendingExecution] = useState<Execution | null>(null);

  const {
    incomingChallenges,
    sentChallenges,
    acceptChallenge,
    declineChallenge,
    markChallengeCompleted,
  } = useChallengeInvites();

  // Get user's profile with their executions and task creators
  const { data } = db.useQuery({
    profiles: {
      executions: {
        task: {
          creator: {},
        },
      },
    },
  });

  const userProfile = data?.profiles?.find((p: any) => p.id === user?.id);

  // Filter executions to only include those with valid task data
  const allExecutions = (userProfile?.executions || []) as any[];
  const executions = allExecutions.filter((e) => e.task?.id) as Execution[];

  // Separate active and completed
  const activeExecutions = executions.filter((e) => !e.completed && e.task);
  const completedExecutions = executions
    .filter((e) => e.completed && e.task)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const handleComplete = async (execution: Execution) => {
    try {
      // Update execution to completed
      await db.transact([
        db.tx.executions[execution.id].update({
          completed: true,
          completedAt: Date.now(),
        }),
      ]);

      // Trigger celebration animation
      setCelebrateId(execution.id);
      setTimeout(() => setCelebrateId(null), 2000);

      // Mark any linked challenge invite as completed
      await markChallengeCompleted(execution.id);

      // Update user streak (simplified logic)
      if (userProfile) {
        const today = new Date().setHours(0, 0, 0, 0);
        const lastCompletion = userProfile.lastCompletionDate
          ? new Date(userProfile.lastCompletionDate).setHours(0, 0, 0, 0)
          : 0;
        const daysSince = Math.floor((today - lastCompletion) / (1000 * 60 * 60 * 24));

        let newStreak = userProfile.dailyStreak || 0;
        if (daysSince === 1) {
          newStreak += 1;
        } else if (daysSince > 1) {
          newStreak = 1;
        }

        await db.transact([
          db.tx.profiles[userProfile.id].update({
            dailyStreak: newStreak,
            lastCompletionDate: Date.now(),
          }),
        ]);
      }
    } catch (err: any) {
      alert('Error completing task: ' + err.message);
    }
  };

  const handleUncomplete = async (executionId: string) => {
    try {
      await db.transact([
        db.tx.executions[executionId].update({
          completed: false,
          completedAt: undefined,
        }),
      ]);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAcceptChallenge = async (inviteId: string) => {
    setProcessingChallengeId(inviteId);
    const result = await acceptChallenge(inviteId);
    if (!result.success) {
      alert('Error: ' + result.error);
    }
    setProcessingChallengeId(null);
  };

  const handleDeclineChallenge = async (inviteId: string) => {
    setProcessingChallengeId(inviteId);
    const result = await declineChallenge(inviteId);
    if (!result.success) {
      alert('Error: ' + result.error);
    }
    setProcessingChallengeId(null);
  };

  // Get recently completed challenges I sent (to show completion status)
  const recentCompletedChallenges = sentChallenges.filter(
    (c) => c.status === 'completed'
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Incoming Challenges */}
      {incomingChallenges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-purple-100 rounded-full text-purple-600 text-sm font-bold">
              {incomingChallenges.length}
            </span>
            Incoming Challenges
          </h2>

          <div className="space-y-3">
            <AnimatePresence>
              {incomingChallenges.map((invite) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-5"
                >
                  {/* Challenger info */}
                  <div className="flex items-center gap-2 mb-3">
                    {invite.fromUser?.profileImage ? (
                      <img
                        src={invite.fromUser.profileImage}
                        alt={invite.fromUser.name || 'Friend'}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${invite.fromUser?.avatarColor || 'from-purple-400 to-blue-500'} flex items-center justify-center text-white text-xs font-bold`}>
                        {(invite.fromUser?.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {invite.fromUser?.name || 'A friend'}
                    </span>
                    <span className="text-sm text-gray-500">challenged you!</span>
                  </div>

                  {/* Task info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {invite.task?.title || 'Unknown Task'}
                  </h3>
                  {invite.task?.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {invite.task.description}
                    </p>
                  )}

                  {/* Message */}
                  {invite.message && (
                    <div className="bg-white/70 rounded-lg px-3 py-2 mb-3 text-sm text-gray-700 italic border border-purple-100">
                      "{invite.message}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptChallenge(invite.id)}
                      disabled={processingChallengeId === invite.id}
                      className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {processingChallengeId === invite.id ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Accepting...
                        </span>
                      ) : (
                        'Accept Challenge'
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineChallenge(invite.id)}
                      disabled={processingChallengeId === invite.id}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Challenge Completions (for challenges I sent) */}
      {recentCompletedChallenges.length > 0 && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Challenge Wins</h3>
          <div className="space-y-2">
            {recentCompletedChallenges.map((challenge) => (
              <div key={challenge.id} className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-bold">✓</span>
                <span className="font-medium text-green-800">
                  {challenge.toUser?.name || 'Your friend'}
                </span>
                <span className="text-green-700">completed</span>
                <span className="font-medium text-green-800 truncate">
                  "{challenge.task?.title}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tasks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your Challenges ({activeExecutions.length})
        </h2>

        {activeExecutions.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500">
            No active tasks. Discover and execute tasks from the feed!
          </div>
        ) : (
          <div className="space-y-3">
            {activeExecutions.map((execution) => (
              <div
                key={execution.id}
                className={`bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all ${
                  celebrateId === execution.id
                    ? 'scale-105 ring-4 ring-green-400'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Creator Metadata */}
                    <CreatorMetadata
                      creator={execution.task?.creator}
                      createdAt={execution.task?.createdAt || 0}
                    />

                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {execution.task?.title || 'Untitled Task'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {execution.task?.description || 'No description'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleComplete(execution)}
                    className="ml-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                  >
                    ✓ Complete
                  </button>
                </div>

                {celebrateId === execution.id && (
                  <div className="mt-3 text-center text-green-600 font-bold animate-bounce">
                    Executed! Keep going!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedExecutions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Completed ({completedExecutions.length})
          </h2>

          <div className="space-y-3">
            {completedExecutions.map((execution) => (
              <div
                key={execution.id}
                className="bg-white rounded-xl shadow-sm p-5 opacity-60 hover:opacity-100 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Creator Metadata */}
                    <CreatorMetadata
                      creator={execution.task?.creator}
                      createdAt={execution.task?.createdAt || 0}
                    />

                    <h3 className="text-xl font-bold text-gray-900 line-through mb-1">
                      {execution.task?.title || 'Untitled Task'}
                    </h3>
                    <p className="text-gray-600 text-sm line-through">
                      {execution.task?.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Completed {new Date(execution.completedAt || 0).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleUncomplete(execution.id)}
                    className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-300 transition-all"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
