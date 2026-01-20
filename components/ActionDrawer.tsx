'use client';

import { useState } from 'react';
import db from '@/lib/db';
import CreatorMetadata from './CreatorMetadata';

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

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Your Actions ({activeExecutions.length})
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
