'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Execution {
  id: string;
  completed: boolean;
  completedAt?: number;
  user?: {
    id: string;
    name?: string;
    profileImage?: string;
    profileImageThumb?: string;
    avatarColor?: string;
  };
}

interface WallOfFameProps {
  executions: Execution[];
}

export default function WallOfFame({ executions }: WallOfFameProps) {
  // Get completed executions, sorted by most recent
  const completers = executions
    .filter((e) => e.completed && e.user)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 10);

  if (completers.length === 0) return null;

  const displayedAvatars = completers.slice(0, 5);
  const overflowCount = completers.length - 5;

  return (
    <div className="flex items-center gap-3 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recent</span>
      <div className="flex -space-x-1.5">
        <AnimatePresence mode="popLayout">
          {displayedAvatars.map((exec, i) => (
            <motion.div
              key={exec.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ zIndex: displayedAvatars.length - i }}
              title={exec.user?.name}
            >
              {exec.user?.profileImageThumb || exec.user?.profileImage ? (
                <img
                  src={exec.user.profileImageThumb || exec.user.profileImage}
                  alt={exec.user.name}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className={`w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br ${exec.user?.avatarColor || 'from-green-400 to-emerald-500'} flex items-center justify-center text-white text-xs font-bold`}>
                  {exec.user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {overflowCount > 0 && (
        <span className="text-xs text-gray-400">+{overflowCount} more</span>
      )}
    </div>
  );
}
