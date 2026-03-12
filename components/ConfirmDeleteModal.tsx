'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  commentCount: number;
  respectCount: number;
  inviteCount: number;
  isDeleting: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  commentCount,
  respectCount,
  inviteCount,
  isDeleting,
}: ConfirmDeleteModalProps) {
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Challenge</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Are you sure you want to delete <span className="font-semibold">&quot;{title}&quot;</span>?
                </p>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>

              {/* Impact Summary */}
              {(commentCount > 0 || respectCount > 0 || inviteCount > 0) && (
                <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-800 mb-1.5">The following will be removed:</p>
                  <ul className="space-y-1">
                    {commentCount > 0 && (
                      <li className="text-xs text-red-700 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                      </li>
                    )}
                    {respectCount > 0 && (
                      <li className="text-xs text-red-700 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        {respectCount} {respectCount === 1 ? 'respect' : 'respects'}
                      </li>
                    )}
                    {inviteCount > 0 && (
                      <li className="text-xs text-red-700 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        {inviteCount} challenge {inviteCount === 1 ? 'invite' : 'invites'}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 mt-2">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
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
