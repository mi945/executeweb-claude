'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import { useFriendship } from '@/hooks/useFriendship';
import FriendButton from '@/components/FriendButton';

export default function FriendsList() {
  const router = useRouter();
  const { user } = db.useAuth();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    ignoreFriendRequest,
  } = useFriendship();

  const [searchQuery, setSearchQuery] = useState('');

  // Query all profiles for search
  const { data: profileData } = db.useQuery({ profiles: {} });
  const allProfiles = profileData?.profiles ?? [];

  // Filter search results: match by name, exclude self, only show when query is non-empty
  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length === 0) return [];
    return allProfiles.filter(
      (p: any) =>
        p.id !== user?.id &&
        p.name?.toLowerCase().includes(trimmed)
    );
  }, [searchQuery, allProfiles, user?.id]);

  const hasContent =
    incomingRequests.length > 0 ||
    friends.length > 0 ||
    outgoingRequests.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Find People</h2>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim().length > 0 && (
          <div className="mt-4">
            {searchResults.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-3">
                No users found matching &ldquo;{searchQuery.trim()}&rdquo;
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((profile: any) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => router.push(`/profile/${profile.id}`)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
                    >
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${profile.avatarColor || 'from-purple-400 to-blue-500'} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
                        >
                          {profile.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 block truncate">
                          {profile.name || 'Anonymous'}
                        </span>
                        {profile.dailyStreak > 0 && (
                          <span className="text-xs text-orange-500 font-medium">
                            {profile.dailyStreak} day streak
                          </span>
                        )}
                      </div>
                    </button>
                    <div className="flex-shrink-0 ml-3">
                      <FriendButton targetUserId={profile.id} compact />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

      {/* Empty State - only show when no search and no content */}
      {!hasContent && searchQuery.trim().length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No friends yet</h2>
          <p className="text-gray-600">
            Use the search bar above to find people!
          </p>
        </div>
      )}
    </div>
  );
}
