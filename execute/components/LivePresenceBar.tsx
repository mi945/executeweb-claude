'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface PresenceUser {
  peerId: string;
  odocId: string;
  odocName: string;
  odocAvatar?: string;
}

interface LivePresenceBarProps {
  activePresences: PresenceUser[];
}

export default function LivePresenceBar({ activePresences }: LivePresenceBarProps) {
  if (activePresences.length === 0) return null;

  const displayedAvatars = activePresences.slice(0, 5);
  const overflowCount = activePresences.length - 5;

  const getLabel = () => {
    if (activePresences.length === 1) {
      return `${activePresences[0].odocName || 'Someone'} is doing this now`;
    }
    return `${activePresences.length} others are doing this now`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3"
    >
      {/* Overlapping avatars */}
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {displayedAvatars.map((user, i) => (
            <motion.div
              key={user.peerId}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ zIndex: displayedAvatars.length - i }}
              className="relative"
            >
              {user.odocAvatar ? (
                <img
                  src={user.odocAvatar}
                  alt={user.odocName}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.odocName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {/* Pulse indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white animate-pulse" />
            </motion.div>
          ))}
        </AnimatePresence>
        {overflowCount > 0 && (
          <div
            style={{ zIndex: 0 }}
            className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-medium"
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Label */}
      <span className="text-sm text-gray-600 font-medium">{getLabel()}</span>
    </motion.div>
  );
}
