'use client';

import { useState } from 'react';
import { useFriendship, RelationshipStatus } from '@/hooks/useFriendship';

interface FriendButtonProps {
  targetUserId: string;
  compact?: boolean;
}

export default function FriendButton({ targetUserId, compact }: FriendButtonProps) {
  const {
    getRelationshipStatus,
    sendFriendRequest,
    acceptFriendRequest,
    ignoreFriendRequest,
    unfriend,
  } = useFriendship();

  const [loading, setLoading] = useState(false);
  const [showUnfriend, setShowUnfriend] = useState(false);

  const status: RelationshipStatus = getRelationshipStatus(targetUserId);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
      setShowUnfriend(false);
    }
  };

  const base = compact ? 'px-3 py-1.5 text-sm rounded-lg' : 'px-6 py-3 rounded-xl';

  if (status === 'none') {
    return (
      <button
        onClick={() => handleAction(() => sendFriendRequest(targetUserId))}
        disabled={loading}
        className={`${base} bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50`}
      >
        {loading ? 'Sending...' : 'Add Friend'}
      </button>
    );
  }

  if (status === 'pending_outgoing') {
    return (
      <button
        disabled
        className={`${base} bg-gray-200 text-gray-500 font-semibold cursor-not-allowed`}
      >
        Sent
      </button>
    );
  }

  if (status === 'pending_incoming') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAction(() => acceptFriendRequest(targetUserId))}
          disabled={loading}
          className={`${base} bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50`}
        >
          {loading ? '...' : 'Accept'}
        </button>
        <button
          onClick={() => handleAction(() => ignoreFriendRequest(targetUserId))}
          disabled={loading}
          className={`${base} bg-gray-200 text-gray-600 font-semibold hover:bg-gray-300 transition-all disabled:opacity-50`}
        >
          Ignore
        </button>
      </div>
    );
  }

  // status === 'accepted'
  if (showUnfriend) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAction(() => unfriend(targetUserId))}
          disabled={loading}
          className={`${base} bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50`}
        >
          {loading ? '...' : compact ? 'Unfriend' : 'Confirm Unfriend'}
        </button>
        <button
          onClick={() => setShowUnfriend(false)}
          className={`${base} bg-gray-200 text-gray-600 font-semibold hover:bg-gray-300 transition-all`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowUnfriend(true)}
      className={`${base} bg-gray-100 text-green-600 font-semibold hover:bg-gray-200 transition-all border border-green-200`}
    >
      Friends &#10003;
    </button>
  );
}
