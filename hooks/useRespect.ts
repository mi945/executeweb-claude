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
      execution: {
        user: {},
      },
    },
  });

  const respects = (data?.respects || []) as any[];

  const toggleRespect = useCallback(
    async (executionId: string, executionUserId: string) => {
      if (!user?.id) {
        console.error('User not authenticated');
        return;
      }

      // Prevent concurrent requests for the same execution
      if (inFlightRef.current.has(executionId)) {
        return;
      }

      inFlightRef.current.add(executionId);

      try {
        // Check if user already respected this execution
        const existingRespect = respects.find(
          (r) => r.fromUser?.id === user.id && r.execution?.id === executionId
        );

        if (existingRespect) {
          // Remove respect
          await db.transact([
            db.tx.respects[existingRespect.id].delete(),
          ]);

          trackEvent('respect_removed', {
            executionId,
            respecteeUserId: executionUserId,
          });
        } else {
          // Add respect
          const respectId = id();
          await db.transact([
            db.tx.respects[respectId].update({
              createdAt: Date.now(),
            }),
            db.tx.executions[executionId].link({ respects: respectId }),
            db.tx.profiles[user.id].link({ givenRespects: respectId }),
          ]);

          trackEvent('respect_given', {
            executionId,
            respecteeUserId: executionUserId,
          });
        }
      } catch (error) {
        console.error('Error toggling respect:', error);
      } finally {
        inFlightRef.current.delete(executionId);
      }
    },
    [user?.id, respects]
  );

  // Check if current user has respected a specific execution
  const hasRespected = useCallback(
    (executionId: string) => {
      return respects.some(
        (r) => r.fromUser?.id === user?.id && r.execution?.id === executionId
      );
    },
    [user?.id, respects]
  );

  // Get respect count for an execution
  const getRespectCount = useCallback(
    (executionId: string) => {
      return respects.filter((r) => r.execution?.id === executionId).length;
    },
    [respects]
  );

  // Get users who respected an execution
  const getRespecters = useCallback(
    (executionId: string) => {
      return respects
        .filter((r) => r.execution?.id === executionId)
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
