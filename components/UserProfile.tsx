'use client';

import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function UserProfile() {
  const router = useRouter();
  const { user } = db.useAuth();

  // Get user's profile
  const { data } = db.useQuery({
    profiles: {
      executions: {},
    },
  });

  const userProfile = data?.profiles?.find((p: any) => p.id === user?.id);

  // Count completed executions
  const completedCount =
    userProfile?.executions?.filter((e: any) => e.completed).length || 0;

  if (!userProfile) {
    return (
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Welcome to Execute!
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Complete your profile to get started.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        {userProfile?.profileImageThumb ? (
          <img
            src={userProfile.profileImageThumb}
            alt={userProfile.name || 'Profile'}
            className="w-16 h-16 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className={`w-16 h-16 bg-gradient-to-br ${userProfile?.avatarColor || 'from-purple-500 to-blue-500'} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
            {userProfile?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">
            {userProfile?.name || 'Anonymous'}
          </h3>
          <p className="text-gray-600 text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-700">
            {completedCount}
          </div>
          <div className="text-xs text-green-600 font-medium">Completed</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-orange-700">
            {userProfile?.dailyStreak || 0}
          </div>
          <div className="text-xs text-orange-600 font-medium">
            Day Streak
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/profile')}
        className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
      >
        View Full Profile
      </button>
    </div>
  );
}
