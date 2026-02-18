'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Friend {
  id: string;
  name?: string;
  profileImage?: string;
  avatarColor?: string;
}

interface ChallengeFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  taskId: string;
  friends: Friend[];
  onSend: (toUserId: string, taskId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  hasPendingInvite: (toUserId: string, taskId: string) => boolean;
}

export default function ChallengeFriendModal({
  isOpen,
  onClose,
  taskTitle,
  taskId,
  friends,
  onSend,
  hasPendingInvite,
}: ChallengeFriendModalProps) {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredFriends = friends.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedFriend) return;

    setIsSending(true);
    setError(null);

    const result = await onSend(selectedFriend, taskId, message || undefined);

    if (result.success) {
      setSentSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to send challenge');
    }

    setIsSending(false);
  };

  const handleClose = () => {
    setSelectedFriend(null);
    setMessage('');
    setSearchQuery('');
    setSentSuccess(false);
    setError(null);
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Challenge a Friend</h2>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  Task: <span className="font-medium text-gray-700">{taskTitle}</span>
                </p>
              </div>

              {/* Success State */}
              {sentSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 text-center"
                >
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-gray-900">Challenge Sent!</p>
                  <p className="text-sm text-gray-500 mt-1">Your friend will see it in their inbox.</p>
                </motion.div>
              ) : (
                <>
                  {/* Search */}
                  <div className="px-5 pt-4">
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Friends List */}
                  <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0" style={{ maxHeight: '240px' }}>
                    {filteredFriends.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        {friends.length === 0
                          ? 'No friends yet. Add friends first!'
                          : 'No friends match your search.'}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredFriends.map((friend) => {
                          const alreadySent = hasPendingInvite(friend.id, taskId);
                          const isSelected = selectedFriend === friend.id;

                          return (
                            <button
                              key={friend.id}
                              onClick={() => !alreadySent && setSelectedFriend(isSelected ? null : friend.id)}
                              disabled={alreadySent}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                                alreadySent
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                  : isSelected
                                  ? 'bg-purple-50 ring-2 ring-purple-400'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* Avatar */}
                              {friend.profileImage ? (
                                <img
                                  src={friend.profileImage}
                                  alt={friend.name || 'Friend'}
                                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div
                                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                                    friend.avatarColor || 'from-purple-400 to-blue-500'
                                  } flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                                >
                                  {(friend.name || '?')[0].toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {friend.name || 'Anonymous'}
                                </p>
                                {alreadySent && (
                                  <p className="text-xs text-amber-600">Challenge already sent</p>
                                )}
                              </div>

                              {/* Selection indicator */}
                              {isSelected && !alreadySent && (
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {alreadySent && (
                                <span className="text-xs text-gray-400 flex-shrink-0">Sent</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  {selectedFriend && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-5 pb-2"
                    >
                      <textarea
                        placeholder="Add a message (optional)..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={200}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:outline-none resize-none"
                      />
                      <p className="text-xs text-gray-400 text-right">{message.length}/200</p>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="px-5 pb-2">
                      <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-5 border-t border-gray-100">
                    <button
                      onClick={handleSend}
                      disabled={!selectedFriend || isSending}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        selectedFriend && !isSending
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isSending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Challenge'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
