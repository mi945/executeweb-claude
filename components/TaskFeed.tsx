'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import { id } from '@instantdb/react';
import ActionCard from './ActionCard';
import TaskDetailModal from './TaskDetailModal';
import { useTaskPresence } from '@/hooks/useTaskPresence';

interface Task {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  createdAt: number;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
    avatarColor?: string;
  };
  executions?: Array<{
    id: string;
    user: { id: string; name?: string; profileImage?: string };
    completed: boolean;
    completedAt?: number;
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
    eventDate: '',
    eventTime: '',
    eventLocation: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [completingExecutionId, setCompletingExecutionId] = useState<string | null>(null);
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract link metadata
  const [linkPreview, setLinkPreview] = useState<{ domain: string; url: string } | null>(null);

  useEffect(() => {
    if (newTask.externalLink && newTask.externalLink.startsWith('http')) {
      try {
        const url = new URL(newTask.externalLink);
        setLinkPreview({ domain: url.hostname, url: newTask.externalLink });
      } catch {
        setLinkPreview(null);
      }
    } else {
      setLinkPreview(null);
    }
  }, [newTask.externalLink]);

  // Update preview when URL is entered
  useEffect(() => {
    if (newTask.imageUrl && newTask.imageUrl.startsWith('http')) {
      setImagePreview(newTask.imageUrl);
    }
  }, [newTask.imageUrl]);

  // Query all tasks with their executions and creator
  const { data } = db.useQuery({
    tasks: {
      creator: {},
      executions: {
        user: {},
      },
    },
  });

  const tasks = ((data?.tasks || []) as Task[]).sort((a, b) => b.createdAt - a.createdAt);

  // Get current user's profile
  const { data: profileData } = db.useQuery({
    profiles: {},
  });

  const userProfile = profileData?.profiles?.find(
    (p: any) => p.id === user?.id
  );

  // Check if user has executed a task
  const hasExecuted = (task: Task) => {
    return task.executions?.some((e) => e.user?.id === user?.id);
  };

  // Check if user has completed a task
  const hasCompleted = (task: Task) => {
    return task.executions?.some(
      (e) => e.user?.id === user?.id && e.completed
    );
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setNewTask({ ...newTask, imageUrl: base64String });
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Error uploading image');
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setNewTask({ ...newTask, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTask.title.trim() || !newTask.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    setIsPublishing(true);
    const taskId = id();

    try {
      // Animate delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));

      // Build transactions array
      const transactions: any[] = [
        db.tx.tasks[taskId].update({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          imageUrl: newTask.imageUrl.trim() || undefined,
          externalLink: newTask.externalLink.trim() || undefined,
          eventDate: newTask.eventDate.trim() || undefined,
          eventTime: newTask.eventTime.trim() || undefined,
          eventLocation: newTask.eventLocation.trim() || undefined,
          createdAt: Date.now(),
        }),
      ];

      // Link to creator profile if exists
      if (userProfile) {
        transactions.push(db.tx.profiles[userProfile.id].link({ createdTasks: taskId }));
      }

      await db.transact(transactions);

      // Reset form
      setNewTask({ title: '', description: '', imageUrl: '', externalLink: '', eventDate: '', eventTime: '', eventLocation: '' });
      setImagePreview('');
      setLinkPreview(null);
      setShowEventDetails(false);
      setIsPublishing(false);
      setShowCreateForm(false);
    } catch (err: any) {
      alert('Error creating task: ' + err.message);
      setIsPublishing(false);
    }
  };

  const handleExecute = async (taskId: string) => {
    // Find the task to check current execution status
    const task = tasks.find(t => t.id === taskId);

    // Check if user already has an incomplete execution
    const hasIncompleteExecution = task?.executions?.some(
      (e) => e.user?.id === user?.id && !e.completed
    );

    if (hasIncompleteExecution) {
      alert("You're already on it! 💪");
      return;
    }

    const executionId = id();
    setExecutingTaskId(taskId);

    try {
      // Build transactions array
      const transactions: any[] = [
        // Create execution
        db.tx.executions[executionId].update({
          executedAt: Date.now(),
          completed: false,
        }),
        // Link to task
        db.tx.tasks[taskId].link({ executions: executionId }),
      ];

      // Link to user profile if exists
      if (userProfile) {
        transactions.push(db.tx.profiles[userProfile.id].link({ executions: executionId }));
      }

      await db.transact(transactions);
    } catch (err: any) {
      alert('Error executing task: ' + err.message);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleComplete = async (executionId: string) => {
    setCompletingExecutionId(executionId);

    // Find the task for this execution to show celebration
    const task = tasks.find(t => t.executions?.some(e => e.id === executionId));

    try {
      // Update execution to completed
      await db.transact([
        db.tx.executions[executionId].update({
          completed: true,
          completedAt: Date.now(),
        }),
      ]);

      // Trigger celebration animation
      if (task) {
        setCelebratingTaskId(task.id);
        setTimeout(() => setCelebratingTaskId(null), 3000);
      }

      // Update user streak (simplified logic)
      if (userProfile) {
        const today = new Date().setHours(0, 0, 0, 0);
        const lastCompletion = userProfile.lastCompletionDate
          ? new Date(userProfile.lastCompletionDate).setHours(0, 0, 0, 0)
          : 0;
        const daysSince = Math.floor((today - lastCompletion) / (1000 * 60 * 60 * 24));

        let newStreak = userProfile.dailyStreak || 0;
        if (daysSince === 1) {
          newStreak += 1;
        } else if (daysSince > 1) {
          newStreak = 1;
        }

        await db.transact([
          db.tx.profiles[userProfile.id].update({
            dailyStreak: newStreak,
            lastCompletionDate: Date.now(),
          }),
        ]);
      }
    } catch (err: any) {
      alert('Error completing task: ' + err.message);
    } finally {
      setCompletingExecutionId(null);
    }
  };

  const toggleCardExpansion = (taskId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTask(null), 300); // Delay clearing task until animation completes
  };

  // Get active users for the selected task
  const { activePresences } = useTaskPresence({
    taskId: selectedTask?.id || '',
    userProfile: userProfile || null,
    isExecuting: false, // Modal is read-only, not executing
  });

  // Live Preview Component
  const LivePreview = () => {
    if (!newTask.title && !newTask.description && !imagePreview && !linkPreview) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {newTask.title || 'Your Task Title'}
          </h3>
          <p className="text-gray-600 mb-4">
            {newTask.description || 'Your task description will appear here...'}
          </p>

          {linkPreview && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 border border-slate-200">
                <div className="w-4 h-4 rounded-sm bg-slate-200 flex items-center justify-center">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {linkPreview.domain}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">0 completions</div>
            <div className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold">
              Execute
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Create Task Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Discover Actions</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          {showCreateForm ? 'Cancel' : '+ Create Challenge'}
        </motion.button>
      </div>

      {/* Enhanced Create Task Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Column */}
              <motion.form
                onSubmit={handleCreateTask}
                className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Create New Action
                </h3>

                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-2xl font-bold placeholder:text-gray-300"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Short, punchy instructions..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none text-lg"
                    rows={4}
                    required
                  />
                </div>

                {/* Drag & Drop Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image (optional)
                  </label>

                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <div className="text-purple-600">
                          <div className="animate-spin mx-auto w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-2"></div>
                          Uploading...
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto w-12 h-12 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-gray-600 font-medium mb-1">
                            Drag & drop your image here
                          </p>
                          <p className="text-gray-400 text-sm">
                            or click to browse (max 2MB)
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* External Link with Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External Link (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newTask.externalLink}
                    onChange={(e) =>
                      setNewTask({ ...newTask, externalLink: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                  />

                  {linkPreview && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-blue-900">
                          {linkPreview.domain}
                        </div>
                        <div className="text-xs text-blue-600 truncate">
                          {linkPreview.url}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Event Details Toggle */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEventDetails(!showEventDetails)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${showEventDetails ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Add Event Details</span>
                  </button>

                  <AnimatePresence>
                    {showEventDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-4">
                          {/* Date Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newTask.eventDate}
                              onChange={(e) =>
                                setNewTask({ ...newTask, eventDate: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                            />
                          </div>

                          {/* Time Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Time
                            </label>
                            <input
                              type="time"
                              value={newTask.eventTime}
                              onChange={(e) =>
                                setNewTask({ ...newTask, eventTime: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                            />
                          </div>

                          {/* Location Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., City Hall, Main Street"
                              value={newTask.eventLocation}
                              onChange={(e) =>
                                setNewTask({ ...newTask, eventLocation: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isPublishing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isPublishing ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                      Launching...
                    </motion.div>
                  ) : (
                    '🚀 Launch Task'
                  )}
                </motion.button>
              </motion.form>

              {/* Live Preview Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Live Preview
                </h3>
                <LivePreview />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Cards - Single Column Layout */}
      <motion.div layout className="flex flex-col gap-4 max-w-xl mx-auto">
        <AnimatePresence>
          {tasks.map((task) => {
            // Find if this task has an execution being completed
            const userExecution = task.executions?.find(e => e.user?.id === user?.id);
            const isCompleting = userExecution?.id === completingExecutionId;
            const showCelebration = task.id === celebratingTaskId;

            return (
              <ActionCard
                key={task.id}
                task={task}
                userProfile={userProfile || null}
                currentUserId={user?.id}
                onExecute={handleExecute}
                onComplete={handleComplete}
                isExecuting={executingTaskId === task.id}
                isCompleting={isCompleting}
                showCelebration={showCelebration}
                onClick={handleCardClick}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {tasks.length === 0 && !showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-500"
        >
          No tasks yet. Be the first to create one!
        </motion.div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activeUsers={activePresences.map(p => ({
          userId: p.odocId,
          userName: p.odocName,
          profileImage: p.odocAvatar,
        }))}
      />
    </div>
  );
}
