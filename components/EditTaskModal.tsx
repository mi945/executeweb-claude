'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, isValidImageFile, MAX_RAW_FILE_SIZE } from '@/lib/imageUtils';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fields: {
    title: string;
    description: string;
    imageUrl?: string;
    externalLink?: string;
    eventDate?: string;
    eventTime?: string;
    eventLocation?: string;
  }) => void;
  task: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    externalLink?: string;
    eventDate?: string;
    eventTime?: string;
    eventLocation?: string;
  } | null;
  hasExecutions: boolean;
  isSaving: boolean;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  hasExecutions,
  isSaving,
}: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setImageUrl(task.imageUrl || '');
      setImagePreview(task.imageUrl || '');
      setExternalLink(task.externalLink || '');
      setEventDate(task.eventDate || '');
      setEventTime(task.eventTime || '');
      setEventLocation(task.eventLocation || '');
      setShowEventDetails(!!(task.eventDate || task.eventTime || task.eventLocation));
    }
  }, [task]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!isValidImageFile(file)) {
      alert('Please select an image file');
      return;
    }
    if (file.size > MAX_RAW_FILE_SIZE) {
      alert('File is too large. Please select a smaller image.');
      return;
    }
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setImageUrl(compressed);
    } catch {
      alert('Error processing image. Please try another file.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      externalLink: externalLink.trim() || undefined,
      eventDate: eventDate.trim() || undefined,
      eventTime: eventTime.trim() || undefined,
      eventLocation: eventLocation.trim() || undefined,
    });
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Edit Challenge</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={hasExecutions}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg font-bold text-gray-900 ${
                      hasExecutions ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    required
                  />
                  {hasExecutions && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m-4.343-5.657a8 8 0 1111.314 0" />
                      </svg>
                      Title is locked because people have started this challenge
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2200}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none text-base text-black font-medium"
                    rows={4}
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-medium ${
                      description.length > 2100 ? 'text-red-500' : description.length > 2000 ? 'text-amber-500' : 'text-gray-400'
                    }`}>
                      {description.length}/2200
                    </span>
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleImageUpload(file);
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                        isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <div className="text-purple-600">
                          <div className="animate-spin mx-auto w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full mb-2"></div>
                          Uploading...
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Drop image or click to browse</p>
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

                {/* External Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">External Link</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-gray-900"
                  />
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
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Event Details
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
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                              type="time"
                              value={eventTime}
                              onChange={(e) => setEventTime(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              placeholder="e.g., City Hall"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-gray-900 placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !title.trim() || !description.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
