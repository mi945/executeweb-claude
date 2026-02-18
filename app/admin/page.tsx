'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import { posthog } from '@/lib/analytics';

interface AnalyticsData {
  totalUsers: number;
  activeToday: number;
  totalTasks: number;
  totalCompletions: number;
  totalChallenges: number;
  totalFriendships: number;
  tasksCreatedToday: number;
  completionsToday: number;
  recentActivity: Array<{
    event: string;
    timestamp: number;
    properties: any;
  }>;
}

// Admin email whitelist
const ADMIN_EMAILS = ['michaelkgaba@gmail.com'];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is authorized admin
  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAuthorized(true);
    } else if (user) {
      // User is logged in but not admin - redirect
      router.push('/');
    }
  }, [user, router]);

  // Query all data from InstantDB
  const { data } = db.useQuery({
    profiles: {},
    tasks: {
      executions: {},
    },
    executions: {},
    challengeInvites: {},
    relationships: {},
  });

  useEffect(() => {
    if (!data) return;

    // Calculate metrics from InstantDB
    const profiles = data.profiles || [];
    const tasks = data.tasks || [];
    const executions = data.executions || [];
    const challenges = data.challengeInvites || [];
    const relationships = data.relationships || [];

    // Get today's timestamp
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    // Calculate metrics
    const totalUsers = profiles.length;
    const totalTasks = tasks.length;
    const totalCompletions = executions.filter((e: any) => e.completed).length;
    const totalChallenges = challenges.length;
    const totalFriendships = relationships.filter((r: any) => r.status === 'accepted').length;

    const tasksCreatedToday = tasks.filter((t: any) => t.createdAt >= todayStart).length;
    const completionsToday = executions.filter(
      (e: any) => e.completed && e.completedAt && e.completedAt >= todayStart
    ).length;

    // For active today, we'll use PostHog data if available
    // For now, approximate as users who completed tasks today
    const activeUserIds = new Set(
      executions
        .filter((e: any) => e.completedAt && e.completedAt >= todayStart)
        .map((e: any) => e.user?.id)
        .filter(Boolean)
    );
    const activeToday = activeUserIds.size;

    setAnalyticsData({
      totalUsers,
      activeToday,
      totalTasks,
      totalCompletions,
      totalChallenges,
      totalFriendships,
      tasksCreatedToday,
      completionsToday,
      recentActivity: [],
    });

    setLoading(false);
  }, [data]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user || loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAuthorized && user ? 'Access denied...' : 'Loading analytics...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-sm mt-1">Execute Platform Metrics</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-all"
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Users"
            value={analyticsData?.totalUsers || 0}
            icon="👥"
            color="purple"
          />
          <KPICard
            title="Active Today"
            value={analyticsData?.activeToday || 0}
            icon="⚡"
            color="blue"
          />
          <KPICard
            title="Tasks Created"
            value={analyticsData?.totalTasks || 0}
            icon="📝"
            color="green"
          />
          <KPICard
            title="Total Completions"
            value={analyticsData?.totalCompletions || 0}
            icon="✅"
            color="orange"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Challenges Sent"
            value={analyticsData?.totalChallenges || 0}
            icon="🎯"
            color="pink"
          />
          <KPICard
            title="Friendships"
            value={analyticsData?.totalFriendships || 0}
            icon="🤝"
            color="indigo"
          />
          <KPICard
            title="Completions Today"
            value={analyticsData?.completionsToday || 0}
            icon="🔥"
            color="red"
          />
        </div>

        {/* PostHog Integration Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 PostHog Integration</h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-semibold">✓ PostHog is now tracking all events!</p>
              <p className="text-green-700 text-sm mt-2">
                Visit your PostHog dashboard to see detailed analytics, session replays, and user insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Events Being Tracked:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• User sign-ups & sign-ins</li>
                  <li>• Task creation, execution & completion</li>
                  <li>• Friend requests & acceptances</li>
                  <li>• Challenge invites & responses</li>
                  <li>• Tab navigation & page views</li>
                  <li>• Session activity</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">View Your Analytics:</h3>
                <a
                  href="https://app.posthog.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Open PostHog Dashboard →
                </a>
                <p className="text-xs text-gray-600 mt-3">
                  Your PostHog project will show:
                  <br />- Real-time event stream
                  <br />- User behavior funnels
                  <br />- Retention cohorts
                  <br />- Session replays
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Tasks */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Tasks by Completions</h2>
          <TopTasksTable tasks={data?.tasks || []} />
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🆕 Recently Created Tasks</h2>
          <RecentTasksTable tasks={data?.tasks || []} />
        </div>
      </main>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    red: 'from-red-500 to-red-600',
  }[color];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <div className={`text-3xl font-black bg-gradient-to-r ${colorClasses} bg-clip-text text-transparent`}>
          {value.toLocaleString()}
        </div>
      </div>
      <h3 className="text-gray-600 font-semibold text-sm">{title}</h3>
    </div>
  );
}

// Top Tasks Table
function TopTasksTable({ tasks }: { tasks: any[] }) {
  const sortedTasks = [...tasks]
    .map((task) => ({
      ...task,
      completionCount: task.executions?.filter((e: any) => e.completed).length || 0,
    }))
    .sort((a, b) => b.completionCount - a.completionCount)
    .slice(0, 10);

  if (sortedTasks.length === 0) {
    return <p className="text-gray-500 text-center py-8">No tasks yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Completions</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Executions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => (
            <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-semibold">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500 truncate max-w-md">
                      {task.description}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-purple-600">
                {task.completionCount}
              </td>
              <td className="py-3 px-4 text-right text-gray-600">
                {task.executions?.length || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Recent Tasks Table
function RecentTasksTable({ tasks }: { tasks: any[] }) {
  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  if (recentTasks.length === 0) {
    return <p className="text-gray-500 text-center py-8">No tasks yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Task</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Creator</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Created</th>
          </tr>
        </thead>
        <tbody>
          {recentTasks.map((task) => (
            <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <p className="font-semibold text-gray-900">{task.title}</p>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {task.description}
                </p>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {task.creator?.name || 'Unknown'}
              </td>
              <td className="py-3 px-4 text-right text-gray-600 text-sm">
                {new Date(task.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
