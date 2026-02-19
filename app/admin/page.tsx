'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';

// Admin email whitelist
const ADMIN_EMAILS = ['michaelkgaba@gmail.com'];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteLog, setDeleteLog] = useState<string[]>([]);

  // Check if user is authorized admin
  useEffect(() => {
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      setIsAuthorized(true);
    } else if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Query all data from InstantDB
  const { data } = db.useQuery({
    profiles: {},
    tasks: {
      creator: {},
      executions: {},
      comments: {},
      challengeInvites: {},
    },
    executions: {},
    challengeInvites: {
      execution: {},
    },
    relationships: {},
    comments: {},
  });

  useEffect(() => {
    if (data) setLoading(false);
  }, [data]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Delete a single task with all related data
  const deleteTask = async (taskId: string) => {
    if (!data) return;

    const task = (data.tasks as any[]).find((t: any) => t.id === taskId);
    if (!task) return;

    const transactions: any[] = [];
    const logs: string[] = [];

    // Delete executions linked to this task
    const taskExecutions = task.executions || [];
    for (const execution of taskExecutions) {
      transactions.push(db.tx.executions[execution.id].delete());
    }
    if (taskExecutions.length > 0) {
      logs.push(`Deleted ${taskExecutions.length} execution(s)`);
    }

    // Delete comments linked to this task
    const taskComments = task.comments || [];
    for (const comment of taskComments) {
      transactions.push(db.tx.comments[comment.id].delete());
    }
    if (taskComments.length > 0) {
      logs.push(`Deleted ${taskComments.length} comment(s)`);
    }

    // Delete challenge invites linked to this task
    const taskChallenges = task.challengeInvites || [];
    for (const challenge of taskChallenges) {
      // Also delete linked execution from challenge if it exists
      if (challenge.execution?.id) {
        transactions.push(db.tx.executions[challenge.execution.id].delete());
      }
      transactions.push(db.tx.challengeInvites[challenge.id].delete());
    }
    if (taskChallenges.length > 0) {
      logs.push(`Deleted ${taskChallenges.length} challenge invite(s)`);
    }

    // Delete the task itself
    transactions.push(db.tx.tasks[taskId].delete());
    logs.push(`Deleted task: "${task.title}"`);

    if (transactions.length > 0) {
      await db.transact(transactions);
    }

    return logs;
  };

  // Delete selected tasks
  const handleBulkDelete = async () => {
    setDeleting(true);
    setDeleteLog([]);
    const allLogs: string[] = [];

    try {
      for (const taskId of selectedTasks) {
        const logs = await deleteTask(taskId);
        if (logs) allLogs.push(...logs);
      }
      allLogs.push(`--- Bulk delete complete: ${selectedTasks.size} task(s) removed ---`);
      setDeleteLog(allLogs);
      setSelectedTasks(new Set());
    } catch (err: any) {
      allLogs.push(`Error: ${err.message}`);
      setDeleteLog(allLogs);
    } finally {
      setDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  // Delete ALL tasks
  const handleDeleteAll = async () => {
    if (!data) return;
    setDeleting(true);
    setDeleteLog([]);
    const allLogs: string[] = [];

    try {
      const allTasks = data.tasks as any[];
      for (const task of allTasks) {
        const logs = await deleteTask(task.id);
        if (logs) allLogs.push(...logs);
      }
      allLogs.push(`--- Delete all complete: ${allTasks.length} task(s) removed ---`);
      setDeleteLog(allLogs);
      setSelectedTasks(new Set());
    } catch (err: any) {
      allLogs.push(`Error: ${err.message}`);
      setDeleteLog(allLogs);
    } finally {
      setDeleting(false);
      setShowDeleteAllConfirm(false);
    }
  };

  // Delete a single task with confirmation
  const handleDeleteSingle = async (taskId: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its related data?`)) return;
    setDeleting(true);
    setDeleteLog([]);

    try {
      const logs = await deleteTask(taskId);
      if (logs) setDeleteLog(logs);
      setSelectedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } catch (err: any) {
      setDeleteLog([`Error: ${err.message}`]);
    } finally {
      setDeleting(false);
    }
  };

  // Toggle task selection
  const toggleSelect = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (!data) return;
    const allTasks = data.tasks as any[];
    if (selectedTasks.size === allTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(allTasks.map((t: any) => t.id)));
    }
  };

  // Calculate analytics
  const profiles = (data?.profiles || []) as any[];
  const tasks = (data?.tasks || []) as any[];
  const executions = (data?.executions || []) as any[];
  const challenges = (data?.challengeInvites || []) as any[];
  const relationships = (data?.relationships || []) as any[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const totalCompletions = executions.filter((e: any) => e.completed).length;
  const totalFriendships = relationships.filter((r: any) => r.status === 'accepted').length;
  const completionsToday = executions.filter(
    (e: any) => e.completed && e.completedAt && e.completedAt >= todayStart
  ).length;
  const activeUserIds = new Set(
    executions
      .filter((e: any) => e.completedAt && e.completedAt >= todayStart)
      .map((e: any) => e.user?.id)
      .filter(Boolean)
  );

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
          <KPICard title="Total Users" value={profiles.length} icon="👥" color="purple" />
          <KPICard title="Active Today" value={activeUserIds.size} icon="⚡" color="blue" />
          <KPICard title="Tasks Created" value={tasks.length} icon="📝" color="green" />
          <KPICard title="Total Completions" value={totalCompletions} icon="✅" color="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard title="Challenges Sent" value={challenges.length} icon="🎯" color="pink" />
          <KPICard title="Friendships" value={totalFriendships} icon="🤝" color="indigo" />
          <KPICard title="Completions Today" value={completionsToday} icon="🔥" color="red" />
        </div>

        {/* PostHog Integration Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 PostHog Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-semibold">✓ PostHog is tracking all events</p>
              <a
                href="https://app.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                Open PostHog Dashboard →
              </a>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Tracking:</h3>
              <p className="text-xs text-gray-600">
                Sign-ins, tasks, executions, completions, friends, challenges, tab views, sessions
              </p>
            </div>
          </div>
        </div>

        {/* User List Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">👥 All Users ({profiles.length})</h2>
            <a
              href="/debug-analytics"
              target="_blank"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
            >
              Debug Analytics →
            </a>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            This shows all unique users in your database. Each should have a unique PostHog distinct_id.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Completions</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Streak</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile: any, index: number) => {
                  const userExecutions = executions.filter((e: any) => e.user?.id === profile.id);
                  const userCompletions = userExecutions.filter((e: any) => e.completed).length;

                  return (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                          {profile.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {profile.name || 'Unnamed User'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{userCompletions}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          profile.dailyStreak > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {profile.dailyStreak || 0} 🔥
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {profiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found
            </div>
          )}
        </div>

        {/* Task Management Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">🗂 Task Management</h2>
            <div className="flex items-center gap-3">
              {selectedTasks.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 text-sm"
                >
                  Delete Selected ({selectedTasks.size})
                </button>
              )}
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={deleting || tasks.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 text-sm"
              >
                Delete All Tasks ({tasks.length})
              </button>
            </div>
          </div>

          {/* Delete Log */}
          {deleteLog.length > 0 && (
            <div className="bg-gray-900 text-green-400 rounded-xl p-4 mb-6 font-mono text-xs max-h-40 overflow-y-auto">
              {deleteLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}

          {/* Task Table */}
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks in database</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-sm">Task</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 text-sm">Creator</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 text-sm">Executions</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 text-sm">Comments</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 text-sm">Challenges</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 text-sm">Created</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 text-sm w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tasks]
                    .sort((a: any, b: any) => b.createdAt - a.createdAt)
                    .map((task: any) => (
                      <tr
                        key={task.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          selectedTasks.has(task.id) ? 'bg-purple-50' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => toggleSelect(task.id)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-sm">
                          {task.creator?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-gray-600">
                          {task.executions?.length || 0}
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-gray-600">
                          {task.comments?.length || 0}
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-gray-600">
                          {task.challengeInvites?.length || 0}
                        </td>
                        <td className="py-3 px-3 text-right text-sm text-gray-600">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteSingle(task.id, task.title)}
                            disabled={deleting}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Tasks by Completions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Tasks by Completions</h2>
          <TopTasksTable tasks={tasks} />
        </div>
      </main>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-3">Delete All Tasks?</h3>
            <p className="text-gray-700 mb-2">
              This will permanently delete:
            </p>
            <ul className="text-gray-600 text-sm space-y-1 mb-4">
              <li>• <strong>{tasks.length}</strong> task(s)</li>
              <li>• All associated executions</li>
              <li>• All associated comments</li>
              <li>• All associated challenge invites</li>
            </ul>
            <p className="text-red-600 text-sm font-semibold mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-3">Delete {selectedTasks.size} Task(s)?</h3>
            <p className="text-gray-700 mb-2">
              This will permanently delete the selected tasks and all their associated data (executions, comments, challenge invites).
            </p>
            <p className="text-red-600 text-sm font-semibold mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : `Delete ${selectedTasks.size} Task(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <div className={`text-3xl font-black bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
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
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">#</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Task</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Completions</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">Executions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task, index) => (
            <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-gray-400 font-semibold text-sm">{index + 1}</td>
              <td className="py-3 px-4">
                <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                <p className="text-xs text-gray-500 truncate max-w-md">{task.description}</p>
              </td>
              <td className="py-3 px-4 text-right font-semibold text-purple-600 text-sm">
                {task.completionCount}
              </td>
              <td className="py-3 px-4 text-right text-gray-600 text-sm">
                {task.executions?.length || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
