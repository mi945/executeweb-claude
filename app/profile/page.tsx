'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState('from-purple-400 to-blue-500');

  // Available avatar colors
  const avatarColors = [
    { name: 'Purple-Blue', value: 'from-purple-400 to-blue-500' },
    { name: 'Pink-Rose', value: 'from-pink-400 to-rose-500' },
    { name: 'Orange-Red', value: 'from-orange-400 to-red-500' },
    { name: 'Green-Emerald', value: 'from-green-400 to-emerald-500' },
    { name: 'Blue-Cyan', value: 'from-blue-400 to-cyan-500' },
    { name: 'Indigo-Purple', value: 'from-indigo-400 to-purple-500' },
    { name: 'Yellow-Orange', value: 'from-yellow-400 to-orange-500' },
    { name: 'Teal-Green', value: 'from-teal-400 to-green-500' },
  ];

  // Get user's profile
  const { data } = db.useQuery({
    profiles: {
      executions: {},
      createdTasks: {},
    },
  });

  const userProfile = data?.profiles?.find((p: any) => p.id === user?.id);

  // Count completed executions
  const completedCount =
    userProfile?.executions?.filter((e: any) => e.completed).length || 0;

  // Count created tasks
  const createdTasksCount = userProfile?.createdTasks?.length || 0;

  // Count active executions
  const activeCount =
    userProfile?.executions?.filter((e: any) => !e.completed).length || 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      if (userProfile) {
        // Update existing profile
        await db.transact([
          db.tx.profiles[userProfile.id].update({
            name: name.trim(),
            avatarColor: avatarColor,
          }),
        ]);
      } else {
        // Create new profile
        const profileId = user?.id!;
        await db.transact([
          db.tx.profiles[profileId].update({
            name: name.trim(),
            avatarColor: avatarColor,
            dailyStreak: 0,
          }),
        ]);
      }

      setIsEditing(false);
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    }
  };

  const handleSignOut = () => {
    db.auth.signOut();
    router.push('/');
  };

  if (!userProfile && !isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 mb-6">
              Let's set up your profile to get started with Execute.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {userProfile ? 'Edit Profile' : 'Create Profile'}
            </h1>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex justify-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                  required
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Avatar Color
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {avatarColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setAvatarColor(color.value)}
                      className={`relative h-12 rounded-xl bg-gradient-to-br ${color.value} transition-all ${
                        avatarColor === color.value
                          ? 'ring-4 ring-purple-500 ring-offset-2 scale-105'
                          : 'hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {avatarColor === color.value && (
                        <svg
                          className="w-6 h-6 text-white absolute inset-0 m-auto drop-shadow-lg"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Save Profile
                </button>
                {userProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
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
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-purple-600 text-4xl font-bold shadow-lg">
                {userProfile?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">
                  {userProfile?.name || 'Anonymous'}
                </h1>
                <p className="text-purple-100 text-lg">{user?.email}</p>
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
                {userProfile?.dailyStreak || 0}
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
                    {userProfile?.name || 'Not set'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Email</span>
                  <span className="font-semibold text-gray-900">
                    {user?.email}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold text-gray-900">
                    {(userProfile?.executions?.length || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => {
                  setName(userProfile?.name || '');
                  setAvatarColor(userProfile?.avatarColor || 'from-purple-400 to-blue-500');
                  setIsEditing(true);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
