'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';
import { id } from '@instantdb/react';
import TaskComments from './TaskComments';

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
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
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

  // Query all tasks with their executions
  const { data } = db.useQuery({
    tasks: {
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
      setImagePreview('');
      setLinkPreview(null);
      setIsPublishing(false);
      setShowCreateForm(false);
    } catch (err: any) {
      alert('Error creating task: ' + err.message);
      setIsPublishing(false);
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
            <a
              href={linkPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline text-sm mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {linkPreview.domain}
            </a>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">0 executions</div>
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
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          {showCreateForm ? 'Cancel' : '+ Create Task'}
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

      {/* Task Cards */}
      <motion.div layout className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {tasks.map((task) => {
            const isExpanded = expandedCards.has(task.id);
            const descriptionLength = task.description.length;
            const needsExpansion = descriptionLength > 120; // Approximate character threshold

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image with 16:9 aspect ratio */}
                {task.imageUrl && (
                  <div className="w-full relative" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={task.imageUrl}
                      alt={task.title}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6 flex flex-col">
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {task.title}
                  </h3>

                  {/* Expandable Description */}
                  <div className="mb-3">
                    <motion.div
                      animate={{ height: isExpanded ? 'auto' : needsExpansion ? '140px' : 'auto' }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="relative overflow-hidden"
                    >
                      <p className="text-gray-600 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Gradient fade overlay - only show when collapsed and needs expansion */}
                      {!isExpanded && needsExpansion && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                          style={{
                            background: 'linear-gradient(to bottom, transparent, white)',
                          }}
                        />
                      )}
                    </motion.div>

                    {/* See More / See Less Button */}
                    {needsExpansion && (
                      <motion.button
                        onClick={() => toggleCardExpansion(task.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            See Less
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            See More
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>

                  {/* External Link */}
                  {task.externalLink && (
                    <a
                      href={task.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline text-sm mb-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Learn more →
                    </a>
                  )}

                  {/* Spacer to push button to bottom */}
                  <div className="flex-grow" />

                  {/* Execution Stats and Button - Pinned to Bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      {task.executions?.length || 0} executions
                    </div>

                    {!hasExecuted(task) ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExecute(task.id)}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Execute
                      </motion.button>
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

                  {/* Comments Section */}
                  <div className="pt-4">
                    <TaskComments taskId={task.id} />
                  </div>
                </div>
              </motion.div>
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
    </div>
  );
}
