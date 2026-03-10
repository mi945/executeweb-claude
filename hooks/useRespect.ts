'use client';

import { useCallback, useRef } from 'react';
import db from '@/lib/db';
import { id } from '@instantdb/react';
import { trackEvent } from '@/lib/analytics';

export function useRespect() {
  const { user } = db.useAuth();
  const inFlightRef = useRef(new Set<string>());

  // Query all respects with their relationships
  const { data } = db.useQuery({
    respects: {
      fromUser: {},
      task: {},
    },
  });

  const respects = (data?.respects || []) as any[];

  const toggleRespect = useCallback(
    async (taskId: string) => {
      if (!user?.id) {
        console.error('User not authenticated');
        return;
      }

      // Prevent concurrent requests for the same task
      if (inFlightRef.current.has(taskId)) {
        return;
      }

      inFlightRef.current.add(taskId);

      try {
        // Check if user already respected this task
        const existingRespect = respects.find(
          (r) => r.fromUser?.id === user.id && r.task?.id === taskId
        );

        if (existingRespect) {
          // Remove respect
          await db.transact([
            db.tx.respects[existingRespect.id].delete(),
          ]);

          trackEvent('respect_removed', {
            taskId,
          });
        } else {
          // Add respect
          const respectId = id();
          await db.transact([
            db.tx.respects[respectId].update({
              createdAt: Date.now(),
            }),
            db.tx.tasks[taskId].link({ respects: respectId }),
            db.tx.profiles[user.id].link({ givenRespects: respectId }),
          ]);

          trackEvent('respect_given', {
            taskId,
          });
        }
      } catch (error) {
        console.error('Error toggling respect:', error);
      } finally {
        inFlightRef.current.delete(taskId);
      }
    },
    [user?.id, respects]
  );

  // Check if current user has respected a specific task
  const hasRespected = useCallback(
    (taskId: string) => {
      return respects.some(
        (r) => r.fromUser?.id === user?.id && r.task?.id === taskId
      );
    },
    [user?.id, respects]
  );

  // Get respect count for a task
  const getRespectCount = useCallback(
    (taskId: string) => {
      return respects.filter((r) => r.task?.id === taskId).length;
    },
    [respects]
  );

  // Get users who respected a task
  const getRespecters = useCallback(
    (taskId: string) => {
      return respects
        .filter((r) => r.task?.id === taskId)
        .map((r) => r.fromUser)
        .filter(Boolean);
    },
    [respects]
  );

  return {
    toggleRespect,
    hasRespected,
    getRespectCount,
    getRespecters,
    respects,
  };
}
