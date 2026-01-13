'use client';

import { useState } from 'react';
import db from '@/lib/db';

export default function UserProfile() {
  const { user } = db.useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');

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
          }),
        ]);
      } else {
        // Create new profile
        const profileId = user?.id!;
        await db.transact([
          db.tx.profiles[profileId].update({
            name: name.trim(),
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
  };

  if (!userProfile && !isEditing) {
    return (
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Welcome to Execute!
        </h3>
        <p className="text-gray-600 mb-4">
          Let's set up your profile to get started.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Create Profile
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {userProfile ? 'Edit Profile' : 'Create Profile'}
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Save
            </button>
            {userProfile && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {userProfile?.name?.charAt(0).toUpperCase() || '?'}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {userProfile?.name || 'Anonymous'}
            </h3>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setName(userProfile?.name || '');
            setIsEditing(true);
          }}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-700">
            {completedCount}
          </div>
          <div className="text-sm text-green-600 font-medium">
            Tasks Completed
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-orange-700">
            {userProfile?.dailyStreak || 0}
          </div>
          <div className="text-sm text-orange-600 font-medium">
            Daily Streak
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
