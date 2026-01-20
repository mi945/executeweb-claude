'use client';

import { useEffect, useMemo } from 'react';
import db from '@/lib/db';

interface PresenceUser {
  odocId: string;
  odocName: string;
  odocAvatar?: string;
  lastActive: number;
}

interface UseTaskPresenceProps {
  taskId: string;
  userProfile: {
    id: string;
    name: string;
    profileImage?: string;
  } | null;
  isExecuting: boolean;
}

export function useTaskPresence({ taskId, userProfile, isExecuting }: UseTaskPresenceProps) {
  // Create room reference for this task
  const taskRoom = (db as any).room('task-execution', taskId);

  // Use presence for the room
  const presenceResult = (db as any).rooms.usePresence(taskRoom, {
    initialPresence: isExecuting && userProfile ? {
      odocId: userProfile.id,
      odocName: userProfile.name,
      odocAvatar: userProfile.profileImage,
      lastActive: Date.now(),
    } : undefined,
  });

  const { peers, publishPresence } = presenceResult || { peers: {}, publishPresence: () => {} };

  // Heartbeat: update lastActive every 60 seconds while executing
  useEffect(() => {
    if (!isExecuting || !userProfile || !publishPresence) return;

    // Initial presence publish
    publishPresence({
      odocId: userProfile.id,
      odocName: userProfile.name,
      odocAvatar: userProfile.profileImage,
      lastActive: Date.now(),
    });

    const interval = setInterval(() => {
      publishPresence({
        odocId: userProfile.id,
        odocName: userProfile.name,
        odocAvatar: userProfile.profileImage,
        lastActive: Date.now(),
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [isExecuting, userProfile, publishPresence]);

  // Filter stale presences (no heartbeat in 90 seconds)
  const activePresences = useMemo(() => {
    if (!peers) return [];

    const now = Date.now();
    return Object.entries(peers)
      .map(([peerId, presence]: [string, any]) => ({
        peerId,
        odocId: presence?.odocId || '',
        odocName: presence?.odocName || '',
        odocAvatar: presence?.odocAvatar,
        lastActive: presence?.lastActive || 0,
      }))
      .filter((p) => {
        // Filter out stale presences
        if (p.lastActive && now - p.lastActive > 90000) return false;
        // Filter out current user
        if (userProfile && p.odocId === userProfile.id) return false;
        // Filter out invalid entries
        if (!p.odocId) return false;
        return true;
      });
  }, [peers, userProfile]);

  return {
    activePresences,
    publishPresence,
    totalActive: activePresences.length,
  };
}
