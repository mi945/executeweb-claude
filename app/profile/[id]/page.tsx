'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = db.useAuth();

  // Get the profile by ID
  const { data } = db.useQuery({
    profiles: {
      executions: {},
      createdTasks: {},
    },
  });

  const viewedProfile = data?.profiles?.find((p: any) => p.id === id);
  const isOwnProfile = user?.id === id;

  // Count completed executions
  const completedCount =
    viewedProfile?.executions?.filter((e: any) => e.completed).length || 0;

  // Count created tasks
  const createdTasksCount = viewedProfile?.createdTasks?.length || 0;

  // Count active executions
  const activeCount =
    viewedProfile?.executions?.filter((e: any) => !e.completed).length || 0;

  if (!viewedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Profile Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              This user profile doesn't exist or hasn't been set up yet.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12">
            <div className="flex items-center gap-6">
              {viewedProfile?.profileImage ? (
                <img
                  src={viewedProfile.profileImage}
                  alt={viewedProfile.name}
                  className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white/30"
                />
              ) : (
                <div className={`w-24 h-24 bg-gradient-to-br ${viewedProfile?.avatarColor || 'from-purple-400 to-blue-500'} rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white/30`}>
                  {viewedProfile?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">
                  {viewedProfile?.name || 'Anonymous'}
                </h1>
                {isOwnProfile && (
                  <p className="text-purple-100 text-lg">{user?.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-gray-50">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {completedCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-orange-600">
                {viewedProfile?.dailyStreak || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Day Streak</div>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {activeCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active</div>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {createdTasksCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Created</div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Profile Information
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Display Name</span>
                  <span className="font-semibold text-gray-900">
                    {viewedProfile?.name || 'Not set'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Tasks Created</span>
                  <span className="font-semibold text-gray-900">
                    {createdTasksCount}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Total Executions</span>
                  <span className="font-semibold text-gray-900">
                    {viewedProfile?.executions?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - only show for own profile */}
            {isOwnProfile && (
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
