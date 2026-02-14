'use client';

import { useState } from 'react';
import { useFriendship, RelationshipStatus } from '@/hooks/useFriendship';

interface FriendButtonProps {
  targetUserId: string;
}

export default function FriendButton({ targetUserId }: FriendButtonProps) {
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

  if (status === 'none') {
    return (
      <button
        onClick={() => handleAction(() => sendFriendRequest(targetUserId))}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Add Friend'}
      </button>
    );
  }

  if (status === 'pending_outgoing') {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
      >
        Request Sent
      </button>
    );
  }

  if (status === 'pending_incoming') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAction(() => acceptFriendRequest(targetUserId))}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={() => handleAction(() => ignoreFriendRequest(targetUserId))}
          disabled={loading}
          className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
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
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
        >
          {loading ? 'Removing...' : 'Confirm Unfriend'}
        </button>
        <button
          onClick={() => setShowUnfriend(false)}
          className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-300 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowUnfriend(true)}
      className="px-6 py-3 bg-gray-100 text-green-600 rounded-xl font-semibold hover:bg-gray-200 transition-all border border-green-200"
    >
      Friends &#10003;
    </button>
  );
}
