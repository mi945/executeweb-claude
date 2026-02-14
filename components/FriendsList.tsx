'use client';

import { useRouter } from 'next/navigation';
import { useFriendship } from '@/hooks/useFriendship';

export default function FriendsList() {
  const router = useRouter();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    ignoreFriendRequest,
  } = useFriendship();

  const hasContent =
    incomingRequests.length > 0 ||
    friends.length > 0 ||
    outgoingRequests.length > 0;

  if (!hasContent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No friends yet</h2>
        <p className="text-gray-600">
          Discover people on the Discover tab!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Friend Requests ({incomingRequests.length})
          </h2>
          <div className="space-y-3">
            {incomingRequests.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-purple-50"
              >
                <button
                  onClick={() => router.push(`/profile/${req.id}`)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {req.profileImage ? (
                    <img
                      src={req.profileImage}
                      alt={req.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${req.avatarColor || 'from-purple-400 to-blue-500'} rounded-full flex items-center justify-center text-white font-bold`}
                    >
                      {req.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">
                    {req.name || 'Anonymous'}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptFriendRequest(req.id)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => ignoreFriendRequest(req.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Friends */}
      {friends.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            My Friends ({friends.length})
          </h2>
          <div className="space-y-3">
            {friends.map((friend: any) => (
              <button
                key={friend.id}
                onClick={() => router.push(`/profile/${friend.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
              >
                {friend.profileImage ? (
                  <img
                    src={friend.profileImage}
                    alt={friend.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${friend.avatarColor || 'from-purple-400 to-blue-500'} rounded-full flex items-center justify-center text-white font-bold`}
                  >
                    {friend.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    {friend.name || 'Anonymous'}
                  </span>
                  {friend.dailyStreak > 0 && (
                    <span className="ml-2 text-sm text-orange-500 font-medium">
                      {friend.dailyStreak} day streak
                    </span>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {outgoingRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Sent Requests ({outgoingRequests.length})
          </h2>
          <div className="space-y-3">
            {outgoingRequests.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
              >
                <button
                  onClick={() => router.push(`/profile/${req.id}`)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {req.profileImage ? (
                    <img
                      src={req.profileImage}
                      alt={req.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${req.avatarColor || 'from-purple-400 to-blue-500'} rounded-full flex items-center justify-center text-white font-bold`}
                    >
                      {req.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">
                    {req.name || 'Anonymous'}
                  </span>
                </button>
                <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-sm font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
