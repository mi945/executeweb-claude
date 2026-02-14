'use client';

import { useCallback, useMemo, useRef } from 'react';
import db from '@/lib/db';
import { id, tx } from '@instantdb/react';
import { trackEvent } from '@/lib/analytics';

export type RelationshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function useFriendship() {
  const { user } = db.useAuth();
  const rateLimitRef = useRef<number[]>([]);

  // Query all relationships with linked profiles
  const { data } = db.useQuery({
    relationships: {
      fromUser: {},
      toUser: {},
    },
  });

  // Get the current user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const myProfile = useMemo(
    () => profileData?.profiles?.find((p: any) => p.id === user?.id),
    [profileData, user?.id]
  );

  const allRelationships = data?.relationships ?? [];

  // Outgoing edges: relationships where I am the sender
  const getOutgoingEdges = useCallback(() => {
    if (!user?.id) return [];
    return allRelationships.filter(
      (r: any) => r.fromUser?.[0]?.id === user.id && r.toUser?.[0]
    );
  }, [allRelationships, user?.id]);

  // Incoming edges: relationships where I am the receiver
  const getIncomingEdges = useCallback(() => {
    if (!user?.id) return [];
    return allRelationships.filter(
      (r: any) => r.toUser?.[0]?.id === user.id && r.fromUser?.[0]
    );
  }, [allRelationships, user?.id]);

  // Mutual accepted friends
  const getMutualAccepted = useCallback(() => {
    const outgoing = getOutgoingEdges().filter((r: any) => r.status === 'accepted');
    return outgoing;
  }, [getOutgoingEdges]);

  // Computed lists
  const friends = useMemo(() => {
    return getOutgoingEdges()
      .filter((r: any) => r.status === 'accepted')
      .map((r: any) => r.toUser[0]);
  }, [getOutgoingEdges]);

  const incomingRequests = useMemo(() => {
    return getIncomingEdges()
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({ ...r.fromUser[0], relationshipId: r.id }));
  }, [getIncomingEdges]);

  const outgoingRequests = useMemo(() => {
    return getOutgoingEdges()
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({ ...r.toUser[0], relationshipId: r.id }));
  }, [getOutgoingEdges]);

  const friendCount = friends.length;

  // Rate limit check
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    rateLimitRef.current = rateLimitRef.current.filter(
      (t) => now - t < RATE_WINDOW_MS
    );
    if (rateLimitRef.current.length >= RATE_LIMIT) {
      alert('You are sending too many friend requests. Please try again later.');
      return false;
    }
    rateLimitRef.current.push(now);
    return true;
  }, []);

  // Get relationship status with another user
  const getRelationshipStatus = useCallback(
    (otherUserId: string): RelationshipStatus => {
      if (!user?.id) return 'none';

      // Check outgoing
      const outgoing = getOutgoingEdges().find(
        (r: any) => r.toUser[0]?.id === otherUserId
      );
      if (outgoing) {
        return outgoing.status === 'accepted' ? 'accepted' : 'pending_outgoing';
      }

      // Check incoming
      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser[0]?.id === otherUserId
      );
      if (incoming) {
        return incoming.status === 'accepted' ? 'accepted' : 'pending_incoming';
      }

      return 'none';
    },
    [user?.id, getOutgoingEdges, getIncomingEdges]
  );

  // Send friend request
  const sendFriendRequest = useCallback(
    async (toUserId: string) => {
      if (!user?.id || !myProfile) return;
      if (toUserId === user.id) return; // no self-friending
      if (!checkRateLimit()) return;

      // Check for existing relationship
      const status = getRelationshipStatus(toUserId);
      if (status !== 'none') return; // duplicate guard

      // Check if there's a reciprocal pending request (they already sent us one)
      const reciprocal = getIncomingEdges().find(
        (r: any) => r.fromUser[0]?.id === toUserId && r.status === 'pending'
      );

      if (reciprocal) {
        // Auto-accept: update their pending to accepted and create reciprocal accepted edge
        const newId = id();
        await db.transact([
          tx.relationships[reciprocal.id].update({
            status: 'accepted',
            acceptedAt: Date.now(),
          }),
          tx.relationships[newId]
            .update({
              status: 'accepted',
              createdAt: Date.now(),
              acceptedAt: Date.now(),
            })
            .link({ fromUser: user.id })
            .link({ toUser: toUserId }),
        ]);
        trackEvent('friend_request_accepted', { fromUserId: toUserId });
        return;
      }

      // Create new pending request
      const newId = id();
      await db.transact([
        tx.relationships[newId]
          .update({
            status: 'pending',
            createdAt: Date.now(),
          })
          .link({ fromUser: user.id })
          .link({ toUser: toUserId }),
      ]);
      trackEvent('friend_request_sent', { toUserId });
    },
    [user?.id, myProfile, checkRateLimit, getRelationshipStatus, getIncomingEdges]
  );

  // Accept friend request
  const acceptFriendRequest = useCallback(
    async (fromUserId: string) => {
      if (!user?.id || !myProfile) return;

      // Find the incoming pending request
      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser[0]?.id === fromUserId && r.status === 'pending'
      );
      if (!incoming) return;

      // Update to accepted and create reciprocal edge
      const newId = id();
      await db.transact([
        tx.relationships[incoming.id].update({
          status: 'accepted',
          acceptedAt: Date.now(),
        }),
        tx.relationships[newId]
          .update({
            status: 'accepted',
            createdAt: Date.now(),
            acceptedAt: Date.now(),
          })
          .link({ fromUser: user.id })
          .link({ toUser: fromUserId }),
      ]);
      trackEvent('friend_request_accepted', { fromUserId });
    },
    [user?.id, myProfile, getIncomingEdges]
  );

  // Ignore (delete) a friend request
  const ignoreFriendRequest = useCallback(
    async (fromUserId: string) => {
      if (!user?.id) return;

      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser[0]?.id === fromUserId && r.status === 'pending'
      );
      if (!incoming) return;

      await db.transact([tx.relationships[incoming.id].delete()]);
      trackEvent('friend_request_ignored', { fromUserId });
    },
    [user?.id, getIncomingEdges]
  );

  // Unfriend (delete both directional edges)
  const unfriend = useCallback(
    async (otherUserId: string) => {
      if (!user?.id) return;

      const outgoing = getOutgoingEdges().find(
        (r: any) => r.toUser[0]?.id === otherUserId
      );
      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser[0]?.id === otherUserId
      );

      const txns: any[] = [];
      if (outgoing) txns.push(tx.relationships[outgoing.id].delete());
      if (incoming) txns.push(tx.relationships[incoming.id].delete());

      if (txns.length > 0) {
        await db.transact(txns);
        trackEvent('friend_removed', { otherUserId });
      }
    },
    [user?.id, getOutgoingEdges, getIncomingEdges]
  );

  return {
    // Computed data
    friends,
    incomingRequests,
    outgoingRequests,
    friendCount,

    // Status helper
    getRelationshipStatus,

    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    ignoreFriendRequest,
    unfriend,

    // Future-proof helpers
    getOutgoingEdges,
    getIncomingEdges,
    getMutualAccepted,
  };
}
