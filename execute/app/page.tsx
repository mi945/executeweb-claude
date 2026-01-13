'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import AuthForm from '@/components/AuthForm';
import TaskFeed from '@/components/TaskFeed';
import ActionDrawer from '@/components/ActionDrawer';
import PulseFeed from '@/components/PulseFeed';
import UserProfile from '@/components/UserProfile';
import NudgeNotifications from '@/components/NudgeNotifications';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'discover' | 'actions' | 'pulse'>(
    'discover'
  );

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

                <nav className="flex gap-2">
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
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      activeTab === 'actions'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    My Actions
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
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                {activeTab === 'discover' && <TaskFeed />}
                {activeTab === 'actions' && <ActionDrawer />}
                {activeTab === 'pulse' && <PulseFeed />}
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
                      <span className="font-bold text-purple-600">
                        {/* Will be populated by real data */}
                        --
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Users</span>
                      <span className="font-bold text-blue-600">
                        {/* Will be populated by real data */}
                        --
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
              Execute - Stop scrolling. Start doing.
            </div>
          </footer>
        </div>
      </db.SignedIn>
    </>
  );
}
