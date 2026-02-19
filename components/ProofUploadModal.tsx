'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, isValidImageFile, MAX_RAW_FILE_SIZE } from '@/lib/imageUtils';

interface ProofUploadModalProps {
  isOpen: boolean;
  taskTitle: string;
  onSubmit: (imageData: string) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

export default function ProofUploadModal({
  isOpen,
  taskTitle,
  onSubmit,
  onSkip,
  onClose,
}: ProofUploadModalProps) {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error uploading image');
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

  const handleSubmit = async () => {
    if (!imagePreview) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(imagePreview);
      // Modal will be closed by parent after successful submission
    } catch (err: any) {
      setError(err.message || 'Failed to submit proof');
      setIsSubmitting(false);
    }
  };

  const handleSkipAndClose = () => {
    onSkip();
    resetState();
  };

  const resetState = () => {
    setImagePreview('');
    setError('');
    setIsUploading(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkipAndClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Task Completed!</h2>
                    <p className="text-green-100 text-sm">Show proof of completion</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <div className="p-4 space-y-3">
                  {/* Task Title */}
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Completed Task:</p>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{taskTitle}</p>
                  </div>

                  {/* Upload Area */}
                  {!imagePreview ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                      }`}
                    >
                      {isUploading ? (
                        <div className="text-green-600">
                          <div className="animate-spin mx-auto w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mb-2"></div>
                          <p className="font-medium text-sm">Uploading...</p>
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
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-700 font-medium mb-1">Upload Proof Image</p>
                          <p className="text-sm text-gray-500">Click or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1.5">PNG, JPG up to 2MB</p>
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
                        aria-label="Upload proof image"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Image Preview */}
                      <div className="relative rounded-xl overflow-hidden border-2 border-green-200">
                        <img
                          src={imagePreview}
                          alt="Proof preview"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => {
                            setImagePreview('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                          aria-label="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Image ready to submit
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2"
                    >
                      <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </motion.div>
                  )}

                  {/* Info Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Note:</span> Proof images are visible to others for 7 days and help build trust in the community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions - Always visible */}
              <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
                <button
                  onClick={handleSkipAndClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!imagePreview || isSubmitting}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                    imagePreview && !isSubmitting
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Proof'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
