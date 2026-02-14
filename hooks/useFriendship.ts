'use client';

import { useCallback, useMemo, useRef } from 'react';
import db from '@/lib/db';
import { id } from '@instantdb/react';
import { trackEvent } from '@/lib/analytics';

export type RelationshipStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Deduplicate by profile ID, keeping the first occurrence
function dedupeByProfileId(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function useFriendship() {
  const { user } = db.useAuth();
  const rateLimitRef = useRef<number[]>([]);
  // Optimistic lock: track user IDs with in-flight requests to prevent duplicates
  const inFlightRef = useRef<Set<string>>(new Set());

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
  // Note: fromUser/toUser are has:'one' links, so they are single objects (not arrays)
  const getOutgoingEdges = useCallback(() => {
    if (!user?.id) return [];
    return allRelationships.filter(
      (r: any) => r.fromUser?.id === user.id && r.toUser
    );
  }, [allRelationships, user?.id]);

  // Incoming edges: relationships where I am the receiver
  const getIncomingEdges = useCallback(() => {
    if (!user?.id) return [];
    return allRelationships.filter(
      (r: any) => r.toUser?.id === user.id && r.fromUser
    );
  }, [allRelationships, user?.id]);

  // Mutual accepted friends
  const getMutualAccepted = useCallback(() => {
    return getOutgoingEdges().filter((r: any) => r.status === 'accepted');
  }, [getOutgoingEdges]);

  // Computed lists — deduplicated by profile ID as a safety net
  const friends = useMemo(() => {
    const raw = getOutgoingEdges()
      .filter((r: any) => r.status === 'accepted')
      .map((r: any) => ({ ...r.toUser, relationshipId: r.id }));
    return dedupeByProfileId(raw);
  }, [getOutgoingEdges]);

  const incomingRequests = useMemo(() => {
    const raw = getIncomingEdges()
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({ ...r.fromUser, relationshipId: r.id }));
    return dedupeByProfileId(raw);
  }, [getIncomingEdges]);

  const outgoingRequests = useMemo(() => {
    const raw = getOutgoingEdges()
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({ ...r.toUser, relationshipId: r.id }));
    return dedupeByProfileId(raw);
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

      // Check optimistic in-flight lock
      if (inFlightRef.current.has(otherUserId)) return 'pending_outgoing';

      // Check outgoing
      const outgoing = getOutgoingEdges().find(
        (r: any) => r.toUser?.id === otherUserId
      );
      if (outgoing) {
        return outgoing.status === 'accepted' ? 'accepted' : 'pending_outgoing';
      }

      // Check incoming
      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser?.id === otherUserId
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

      // Optimistic lock: prevent concurrent sends to the same user
      if (inFlightRef.current.has(toUserId)) return;

      // Check for existing relationship
      const status = getRelationshipStatus(toUserId);
      if (status !== 'none') return; // duplicate guard

      // Mark as in-flight before the async transaction
      inFlightRef.current.add(toUserId);

      try {
        // Check if there's a reciprocal pending request (they already sent us one)
        const reciprocal = getIncomingEdges().find(
          (r: any) => r.fromUser?.id === toUserId && r.status === 'pending'
        );

        if (reciprocal) {
          // Auto-accept: update their pending to accepted and create reciprocal accepted edge
          const newId = id();
          await db.transact([
            db.tx.relationships[reciprocal.id].update({
              status: 'accepted',
              acceptedAt: Date.now(),
            }),
            db.tx.relationships[newId].update({
              status: 'accepted',
              createdAt: Date.now(),
              acceptedAt: Date.now(),
            }),
            db.tx.profiles[user.id].link({ outgoingRelationships: newId }),
            db.tx.profiles[toUserId].link({ incomingRelationships: newId }),
          ]);
          trackEvent('friend_request_accepted', { fromUserId: toUserId });
          return;
        }

        // Create new pending request
        const newId = id();
        await db.transact([
          db.tx.relationships[newId].update({
            status: 'pending',
            createdAt: Date.now(),
          }),
          db.tx.profiles[user.id].link({ outgoingRelationships: newId }),
          db.tx.profiles[toUserId].link({ incomingRelationships: newId }),
        ]);
        trackEvent('friend_request_sent', { toUserId });
      } finally {
        // Release in-flight lock after transaction settles
        inFlightRef.current.delete(toUserId);
      }
    },
    [user?.id, myProfile, checkRateLimit, getRelationshipStatus, getIncomingEdges]
  );

  // Accept friend request
  const acceptFriendRequest = useCallback(
    async (fromUserId: string) => {
      if (!user?.id || !myProfile) return;
      if (inFlightRef.current.has(fromUserId)) return;
      inFlightRef.current.add(fromUserId);

      try {
        // Find the incoming pending request
        const incoming = getIncomingEdges().find(
          (r: any) => r.fromUser?.id === fromUserId && r.status === 'pending'
        );
        if (!incoming) return;

        // Update to accepted and create reciprocal edge
        const newId = id();
        await db.transact([
          db.tx.relationships[incoming.id].update({
            status: 'accepted',
            acceptedAt: Date.now(),
          }),
          db.tx.relationships[newId].update({
            status: 'accepted',
            createdAt: Date.now(),
            acceptedAt: Date.now(),
          }),
          db.tx.profiles[user.id].link({ outgoingRelationships: newId }),
          db.tx.profiles[fromUserId].link({ incomingRelationships: newId }),
        ]);
        trackEvent('friend_request_accepted', { fromUserId });
      } finally {
        inFlightRef.current.delete(fromUserId);
      }
    },
    [user?.id, myProfile, getIncomingEdges]
  );

  // Ignore (delete) a friend request
  const ignoreFriendRequest = useCallback(
    async (fromUserId: string) => {
      if (!user?.id) return;

      const incoming = getIncomingEdges().find(
        (r: any) => r.fromUser?.id === fromUserId && r.status === 'pending'
      );
      if (!incoming) return;

      await db.transact([db.tx.relationships[incoming.id].delete()]);
      trackEvent('friend_request_ignored', { fromUserId });
    },
    [user?.id, getIncomingEdges]
  );

  // Unfriend (delete both directional edges)
  const unfriend = useCallback(
    async (otherUserId: string) => {
      if (!user?.id) return;

      // Delete ALL edges between the two users (handles duplicates)
      const outgoing = getOutgoingEdges().filter(
        (r: any) => r.toUser?.id === otherUserId
      );
      const incoming = getIncomingEdges().filter(
        (r: any) => r.fromUser?.id === otherUserId
      );

      const txns: any[] = [];
      for (const r of outgoing) txns.push(db.tx.relationships[r.id].delete());
      for (const r of incoming) txns.push(db.tx.relationships[r.id].delete());

      if (txns.length > 0) {
        await db.transact(txns);
        trackEvent('friend_removed', { otherUserId });
      }
    },
    [user?.id, getOutgoingEdges, getIncomingEdges]
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    friendCount,
    getRelationshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    ignoreFriendRequest,
    unfriend,
    getOutgoingEdges,
    getIncomingEdges,
    getMutualAccepted,
  };
}
