'use client';

import { useEffect, useState } from 'react';
import db from '@/lib/db';

interface Completion {
  id: string;
  completedAt?: number;
  task: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name?: string;
  };
}

export default function PulseFeed() {
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);

  // Query all completed executions
  const { data } = db.useQuery({
    executions: {
      task: {},
      user: {},
    },
  });

  useEffect(() => {
    if (data?.executions) {
      const completed = (data.executions as any[])
        .filter((e) => e.completed && e.completedAt)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 20);

      setRecentCompletions(completed);
    }
  }, [data]);

  // Find collective moments (same task completed by multiple users recently)
  const findCollectiveMoments = () => {
    const taskCompletions = new Map<string, Completion[]>();

    recentCompletions.forEach((completion) => {
      const taskId = completion.task.id;
      if (!taskCompletions.has(taskId)) {
        taskCompletions.set(taskId, []);
      }
      taskCompletions.get(taskId)!.push(completion);
    });

    return Array.from(taskCompletions.entries())
      .filter(([_, completions]) => completions.length >= 2)
      .map(([taskId, completions]) => ({
        taskId,
        taskTitle: completions[0].task.title,
        count: completions.length,
        completions,
      }));
  };

  const collectiveMoments = findCollectiveMoments();

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">The Pulse</h2>

      {/* Collective Moments */}
      {collectiveMoments.length > 0 && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-3">
            Collective Moments
          </h3>
          <div className="space-y-2">
            {collectiveMoments.map((moment) => (
              <div
                key={moment.taskId}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {moment.count} people completed
                    </div>
                    <div className="text-sm text-gray-600">
                      "{moment.taskTitle}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Completions</h3>
        </div>

        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {recentCompletions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No completions yet. Be the first!
            </div>
          ) : (
            recentCompletions.map((completion) => (
              <div
                key={completion.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">
                        {completion.user.name || 'Someone'}
                      </span>{' '}
                      <span className="text-gray-600">completed</span>{' '}
                      <span className="font-semibold text-purple-600">
                        {completion.task.title}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    {getTimeAgo(completion.completedAt || 0)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
