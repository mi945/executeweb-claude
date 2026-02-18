'use client';

import { useCallback, useMemo, useRef } from 'react';
import db from '@/lib/db';
import { id } from '@instantdb/react';
import { useFriendship } from './useFriendship';
import { trackEvent } from '@/lib/analytics';

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface ChallengeInvite {
  id: string;
  message?: string;
  status: ChallengeStatus;
  createdAt: number;
  respondedAt?: number;
  completedAt?: number;
  fromUser?: {
    id: string;
    name?: string;
    profileImage?: string;
    avatarColor?: string;
  };
  toUser?: {
    id: string;
    name?: string;
    profileImage?: string;
    avatarColor?: string;
  };
  task?: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
  };
  execution?: {
    id: string;
    completed: boolean;
    completedAt?: number;
  };
}

export function useChallengeInvites() {
  const { user } = db.useAuth();
  const { friends } = useFriendship();
  const inFlightRef = useRef<Set<string>>(new Set());

  // Query all challenge invites with linked data
  const { data } = db.useQuery({
    challengeInvites: {
      fromUser: {},
      toUser: {},
      task: {},
      execution: {},
    },
  });

  // Get current user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const myProfile = useMemo(
    () => profileData?.profiles?.find((p: any) => p.id === user?.id),
    [profileData, user?.id]
  );

  const allInvites = (data?.challengeInvites || []) as ChallengeInvite[];

  // Incoming challenges (sent TO me)
  const incomingChallenges = useMemo(() => {
    if (!user?.id) return [];
    return allInvites
      .filter((inv) => inv.toUser?.id === user.id && inv.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allInvites, user?.id]);

  // Outgoing challenges (sent BY me)
  const sentChallenges = useMemo(() => {
    if (!user?.id) return [];
    return allInvites
      .filter((inv) => inv.fromUser?.id === user.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [allInvites, user?.id]);

  // Check if there's already a pending invite for a specific user+task combo
  const hasPendingInvite = useCallback(
    (toUserId: string, taskId: string): boolean => {
      return allInvites.some(
        (inv) =>
          inv.fromUser?.id === user?.id &&
          inv.toUser?.id === toUserId &&
          inv.task?.id === taskId &&
          inv.status === 'pending'
      );
    },
    [allInvites, user?.id]
  );

  // Check if a user is an accepted friend
  const isFriend = useCallback(
    (userId: string): boolean => {
      return friends.some((f: any) => f.id === userId);
    },
    [friends]
  );

  // Send a challenge invite
  const sendChallenge = useCallback(
    async (toUserId: string, taskId: string, message?: string) => {
      if (!user?.id || !myProfile) return { success: false, error: 'Not logged in' };
      if (toUserId === user.id) return { success: false, error: 'Cannot challenge yourself' };

      // Must be friends
      if (!isFriend(toUserId)) return { success: false, error: 'Can only challenge accepted friends' };

      // Prevent duplicate pending invites
      if (hasPendingInvite(toUserId, taskId)) {
        return { success: false, error: 'Challenge already sent for this task' };
      }

      // Optimistic lock
      const lockKey = `${toUserId}:${taskId}`;
      if (inFlightRef.current.has(lockKey)) return { success: false, error: 'Already sending' };
      inFlightRef.current.add(lockKey);

      try {
        const inviteId = id();
        await db.transact([
          db.tx.challengeInvites[inviteId].update({
            message: message?.trim() || undefined,
            status: 'pending',
            createdAt: Date.now(),
          }),
          db.tx.challengeInvites[inviteId].link({ fromUser: user.id }),
          db.tx.challengeInvites[inviteId].link({ toUser: toUserId }),
          db.tx.challengeInvites[inviteId].link({ task: taskId }),
        ]);

        // Track challenge sent
        trackEvent('challenge_sent', {
          inviteId,
          taskId,
          toUserId,
          hasMessage: !!message?.trim(),
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      } finally {
        inFlightRef.current.delete(lockKey);
      }
    },
    [user?.id, myProfile, isFriend, hasPendingInvite]
  );

  // Accept a challenge - creates an execution and links it
  const acceptChallenge = useCallback(
    async (inviteId: string) => {
      if (!user?.id || !myProfile) return { success: false, error: 'Not logged in' };

      const invite = allInvites.find((inv) => inv.id === inviteId);
      if (!invite || invite.status !== 'pending') {
        return { success: false, error: 'Invite not found or already responded' };
      }
      if (invite.toUser?.id !== user.id) {
        return { success: false, error: 'Not your invite' };
      }

      // Optimistic lock
      if (inFlightRef.current.has(inviteId)) return { success: false, error: 'Already processing' };
      inFlightRef.current.add(inviteId);

      try {
        const executionId = id();
        const taskId = invite.task?.id;
        if (!taskId) return { success: false, error: 'No task linked to invite' };

        await db.transact([
          // Update invite status
          db.tx.challengeInvites[inviteId].update({
            status: 'accepted',
            respondedAt: Date.now(),
          }),
          // Create execution (In Progress)
          db.tx.executions[executionId].update({
            executedAt: Date.now(),
            completed: false,
          }),
          // Link execution to task
          db.tx.tasks[taskId].link({ executions: executionId }),
          // Link execution to user profile
          db.tx.profiles[user.id].link({ executions: executionId }),
          // Link execution to challenge invite
          db.tx.challengeInvites[inviteId].link({ execution: executionId }),
        ]);

        // Track challenge accepted
        trackEvent('challenge_accepted', {
          inviteId,
          taskId,
          executionId,
          fromUserId: invite.fromUser?.id,
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      } finally {
        inFlightRef.current.delete(inviteId);
      }
    },
    [user?.id, myProfile, allInvites]
  );

  // Decline a challenge
  const declineChallenge = useCallback(
    async (inviteId: string) => {
      if (!user?.id) return { success: false, error: 'Not logged in' };

      const invite = allInvites.find((inv) => inv.id === inviteId);
      if (!invite || invite.status !== 'pending') {
        return { success: false, error: 'Invite not found or already responded' };
      }
      if (invite.toUser?.id !== user.id) {
        return { success: false, error: 'Not your invite' };
      }

      try {
        await db.transact([
          db.tx.challengeInvites[inviteId].update({
            status: 'declined',
            respondedAt: Date.now(),
          }),
        ]);

        // Track challenge declined
        trackEvent('challenge_declined', {
          inviteId,
          taskId: invite.task?.id,
          fromUserId: invite.fromUser?.id,
        });

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [user?.id, allInvites]
  );

  // Mark a challenge as completed (called when the recipient marks the task done)
  const markChallengeCompleted = useCallback(
    async (executionId: string) => {
      if (!user?.id) return;

      // Find any accepted challenge invite linked to this execution
      const invite = allInvites.find(
        (inv) =>
          inv.execution?.id === executionId &&
          inv.status === 'accepted' &&
          inv.toUser?.id === user.id
      );

      if (invite) {
        await db.transact([
          db.tx.challengeInvites[invite.id].update({
            status: 'completed',
            completedAt: Date.now(),
          }),
        ]);

        // Track challenge completed
        trackEvent('challenge_completed', {
          inviteId: invite.id,
          taskId: invite.task?.id,
          executionId,
          fromUserId: invite.fromUser?.id,
        });
      }
    },
    [user?.id, allInvites]
  );

  // Get challenge invites sent by me for a specific task
  const getSentChallengesForTask = useCallback(
    (taskId: string) => {
      return sentChallenges.filter((inv) => inv.task?.id === taskId);
    },
    [sentChallenges]
  );

  return {
    incomingChallenges,
    sentChallenges,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    markChallengeCompleted,
    hasPendingInvite,
    getSentChallengesForTask,
    friends,
  };
}
