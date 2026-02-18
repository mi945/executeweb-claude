'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import AuthForm from '@/components/AuthForm';
import TaskFeed from '@/components/TaskFeed';
import ActionDrawer from '@/components/ActionDrawer';
import PulseFeed from '@/components/PulseFeed';
import UserProfile from '@/components/UserProfile';
import NudgeNotifications from '@/components/NudgeNotifications';
import FriendsList from '@/components/FriendsList';
import { useFriendship } from '@/hooks/useFriendship';
import { useChallengeInvites } from '@/hooks/useChallengeInvites';
import { identifyUser, trackEvent, startSession, trackPageView } from '@/lib/analytics';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'actions' | 'pulse' | 'friends'>(
    'discover'
  );
  const [todayCompletions, setTodayCompletions] = useState<number>(0);
  const { incomingRequests } = useFriendship();
  const { incomingChallenges } = useChallengeInvites();
  const pendingCount = incomingRequests.length;
  const challengeCount = incomingChallenges.length;

  // Get current user
  const { user } = db.useAuth();

  // Query all executions to calculate today's completions
  const { data } = db.useQuery({
    executions: {},
    profiles: {
      $: {
        where: {
          id: user?.id,
        },
      },
    },
  });

  // Track user identification and session start
  useEffect(() => {
    if (user?.id) {
      const profile = data?.profiles?.[0];

      identifyUser(user.id, {
        email: user.email,
        name: profile?.name,
        profileImage: profile?.profileImage,
        avatarColor: profile?.avatarColor,
      });

      startSession();
      trackPageView('home');
    }
  }, [user?.id, data?.profiles]);

  // Track tab changes
  useEffect(() => {
    if (user?.id) {
      trackEvent('tab_viewed', {
        tab: activeTab,
      });
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (data?.executions) {
      // Get start of today in milliseconds
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();

      // Filter executions completed today
      const completedToday = (data.executions as any[]).filter(
        (e) => e.completed && e.completedAt && e.completedAt >= todayStart
      );

      setTodayCompletions(completedToday.length);
    }
  }, [data]);

  return (
    <>
      <db.SignedOut>
        <AuthForm />
      </db.SignedOut>

      <db.SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
          {/* Notifications */}
          <NudgeNotifications />

          {/* Header */}
          <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  Execute
                </h1>

                <div className="flex items-center gap-3">
                  <nav className="hidden md:flex gap-2">
                    <button
                      onClick={() => setActiveTab('discover')}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === 'discover'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Discover
                    </button>
                    <button
                      onClick={() => setActiveTab('actions')}
                      className={`relative px-4 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === 'actions'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      My Actions
                      {challengeCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {challengeCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('pulse')}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === 'pulse'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Pulse
                    </button>
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`relative px-4 py-2 rounded-xl font-semibold transition-all ${
                        activeTab === 'friends'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Friends
                      {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  </nav>

                  <button
                    onClick={() => router.push('/profile')}
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </button>

                  <button
                    onClick={() => router.push('/admin')}
                    className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-all"
                    title="Analytics Dashboard"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Analytics
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                {activeTab === 'discover' && <TaskFeed />}
                {activeTab === 'actions' && <ActionDrawer />}
                {activeTab === 'pulse' && <PulseFeed />}
                {activeTab === 'friends' && <FriendsList />}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <UserProfile />

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Today's Impact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Global Completions</span>
                      <span className="font-bold text-purple-600 text-2xl">
                        {todayCompletions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
            <div className="flex justify-around items-center h-16">
              <button
                onClick={() => setActiveTab('discover')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  activeTab === 'discover' ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs mt-1 font-medium">Discover</span>
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  activeTab === 'actions' ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {challengeCount > 0 && (
                  <span className="absolute top-1 right-1/4 bg-purple-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {challengeCount}
                  </span>
                )}
                <span className="text-xs mt-1 font-medium">Actions</span>
              </button>

              <button
                onClick={() => setActiveTab('pulse')}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  activeTab === 'pulse' ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs mt-1 font-medium">Pulse</span>
              </button>

              <button
                onClick={() => setActiveTab('friends')}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  activeTab === 'friends' ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
                <span className="text-xs mt-1 font-medium">Friends</span>
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs mt-1 font-medium">Profile</span>
              </button>
            </div>
          </nav>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
              Execute - Stop scrolling. Start doing.
            </div>
          </footer>
        </div>
      </db.SignedIn>
    </>
  );
}
