'use client';

import { useEffect, useState } from 'react';
import db from '@/lib/db';

interface Notification {
  id: string;
  taskTitle: string;
  userName: string;
  timestamp: number;
}

export default function NudgeNotifications() {
  const { user } = db.useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // Query all executions to watch for new completions
  const { data } = db.useQuery({
    executions: {
      task: {},
      user: {},
    },
  });

  // Get user's profile with their executions to know which tasks they're tracking
  const { data: profileData } = db.useQuery({
    profiles: {
      executions: {
        task: {},
      },
    },
  });

  const userProfile = profileData?.profiles?.find((p: any) => p.id === user?.id);
  const userTaskIds = new Set(
    userProfile?.executions?.map((e: any) => e.task.id) || []
  );

  useEffect(() => {
    if (!data?.executions) return;

    // Find new completions since last check
    const newCompletions = (data.executions as any[])
      .filter((e) => {
        // Must be completed
        if (!e.completed || !e.completedAt) return false;

        // Must be after last check time
        if (e.completedAt <= lastCheckTime) return false;

        // Must be by someone else
        if (e.user.id === user?.id) return false;

        // Must be a task the current user has also executed
        if (!userTaskIds.has(e.task.id)) return false;

        return true;
      })
      .map((e) => ({
        id: e.id,
        taskTitle: e.task.title,
        userName: e.user.name || 'Someone',
        timestamp: e.completedAt,
      }));

    if (newCompletions.length > 0) {
      setNotifications((prev) => [...newCompletions, ...prev].slice(0, 5));
    }

    setLastCheckTime(Date.now());
  }, [data, user?.id, userTaskIds, lastCheckTime]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-2xl p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold mb-1">Nudge!</div>
              <div className="text-sm opacity-90">
                <strong>{notification.userName}</strong> just completed{' '}
                <strong>"{notification.taskTitle}"</strong>
              </div>
              <div className="text-xs opacity-75 mt-2">
                Keep the momentum going!
              </div>
            </div>

            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
