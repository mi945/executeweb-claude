'use client';

import { useState, useEffect } from 'react';
import db from '@/lib/db';
import { id } from '@instantdb/react';

interface Task {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  createdAt: number;
  executions?: Array<{
    id: string;
    user: { id: string };
    completed: boolean;
  }>;
}

export default function TaskFeed() {
  const { user } = db.useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    imageUrl: '',
    externalLink: '',
  });

  // Query all tasks with their executions
  const { data } = db.useQuery({
    tasks: {
      executions: {
        user: {},
      },
    },
  });

  const tasks = (data?.tasks || []) as Task[];

  // Get current user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const userProfile = profileData?.profiles?.find(
    (p: any) => p.id === user?.id
  );

  // Check if user has executed a task
  const hasExecuted = (task: Task) => {
    return task.executions?.some((e) => e.user.id === user?.id);
  };

  // Check if user has completed a task
  const hasCompleted = (task: Task) => {
    return task.executions?.some(
      (e) => e.user.id === user?.id && e.completed
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim() || !newTask.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    const taskId = id();

    try {
      // Create the task
      await db.transact([
        db.tx.tasks[taskId].update({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          imageUrl: newTask.imageUrl.trim() || undefined,
          externalLink: newTask.externalLink.trim() || undefined,
          createdAt: Date.now(),
        }),
        // Link to creator profile
        userProfile &&
          db.tx.profiles[userProfile.id].link({ createdTasks: taskId }),
      ].filter(Boolean));

      // Reset form
      setNewTask({ title: '', description: '', imageUrl: '', externalLink: '' });
      setShowCreateForm(false);
    } catch (err: any) {
      alert('Error creating task: ' + err.message);
    }
  };

  const handleExecute = async (taskId: string) => {
    const executionId = id();

    try {
      await db.transact([
        // Create execution
        db.tx.executions[executionId].update({
          executedAt: Date.now(),
          completed: false,
        }),
        // Link to task
        db.tx.tasks[taskId].link({ executions: executionId }),
        // Link to user profile
        userProfile &&
          db.tx.profiles[userProfile.id].link({ executions: executionId }),
      ].filter(Boolean));
    } catch (err: any) {
      alert('Error executing task: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Task Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Discover Actions</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          {showCreateForm ? 'Cancel' : '+ Create Task'}
        </button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg font-semibold"
            required
          />
          <textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none"
            rows={3}
            required
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={newTask.imageUrl}
            onChange={(e) =>
              setNewTask({ ...newTask, imageUrl: e.target.value })
            }
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
          />
          <input
            type="url"
            placeholder="External link (optional)"
            value={newTask.externalLink}
            onChange={(e) =>
              setNewTask({ ...newTask, externalLink: e.target.value })
            }
            className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Create Task
          </button>
        </form>
      )}

      {/* Task Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {task.imageUrl && (
              <img
                src={task.imageUrl}
                alt={task.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title}
              </h3>
              <p className="text-gray-600 mb-4">{task.description}</p>

              {task.externalLink && (
                <a
                  href={task.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mb-4 block"
                >
                  Learn more →
                </a>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {task.executions?.length || 0} executions
                </div>

                {!hasExecuted(task) ? (
                  <button
                    onClick={() => handleExecute(task.id)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    Execute
                  </button>
                ) : hasCompleted(task) ? (
                  <div className="px-6 py-2 bg-green-100 text-green-700 rounded-xl font-semibold">
                    ✓ Completed
                  </div>
                ) : (
                  <div className="px-6 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-semibold">
                    In Progress
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && !showCreateForm && (
        <div className="text-center py-12 text-gray-500">
          No tasks yet. Be the first to create one!
        </div>
      )}
    </div>
  );
}
