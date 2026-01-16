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
  const taskRoom = db.room('task-execution', taskId);

  const { peers, publishPresence } = taskRoom.usePresence({
    user: isExecuting && userProfile ? {
      odocId: userProfile.id,
      odocName: userProfile.name,
      odocAvatar: userProfile.profileImage,
      lastActive: Date.now(),
    } : undefined,
  });

  // Heartbeat: update lastActive every 60 seconds while executing
  useEffect(() => {
    if (!isExecuting || !userProfile) return;

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
      .map(([peerId, presence]) => ({
        peerId,
        ...(presence as PresenceUser),
      }))
      .filter((p) => {
        // Filter out stale presences
        if (p.lastActive && now - p.lastActive > 90000) return false;
        // Filter out current user
        if (userProfile && p.odocId === userProfile.id) return false;
        return true;
      });
  }, [peers, userProfile]);

  return {
    activePresences,
    publishPresence,
    totalActive: activePresences.length,
  };
}
