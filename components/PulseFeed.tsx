'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import db from '@/lib/db';

interface Completion {
  id: string;
  completedAt?: number;
  proofImageUrl?: string;
  proofUploadedAt?: number;
  proofExpiresAt?: number;
  task: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name?: string;
    profileImage?: string;
    avatarColor?: string;
  };
}

export default function PulseFeed() {
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);
  const [selectedProof, setSelectedProof] = useState<Completion | null>(null);

  // Query all completed executions
  const { data, isLoading } = db.useQuery({
    executions: {
      task: {},
      user: {},
    },
  });

  useEffect(() => {
    if (data?.executions) {
      const completed = (data.executions as any[])
        .filter((e) => e.completed && e.completedAt)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
        .slice(0, 20);

      setRecentCompletions(completed);
    }
  }, [data]);

  // Get valid proofs (not expired, has image)
  const proofs = recentCompletions.filter((c) => {
    if (!c.proofImageUrl) return false;
    if (c.proofExpiresAt && Date.now() > c.proofExpiresAt) return false;
    return true;
  });

  // Find collective moments (same task completed by multiple users recently)
  const findCollectiveMoments = () => {
    const taskCompletions = new Map<string, Completion[]>();

    recentCompletions.forEach((completion) => {
      const taskId = completion.task.id;
      if (!taskCompletions.has(taskId)) {
        taskCompletions.set(taskId, []);
      }
      taskCompletions.get(taskId)!.push(completion);
    });

    return Array.from(taskCompletions.entries())
      .filter(([_, completions]) => completions.length >= 2)
      .map(([taskId, completions]) => ({
        taskId,
        taskTitle: completions[0].task.title,
        count: completions.length,
        completions,
      }));
  };

  const collectiveMoments = findCollectiveMoments();

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getDaysLeft = (expiresAt: number) => {
    const daysLeft = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">The Pulse</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1.5" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">The Pulse</h2>

      {/* Proof Wall */}
      {proofs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Proof Wall</h3>
            <span className="text-xs text-gray-500 ml-auto">{proofs.length} {proofs.length === 1 ? 'proof' : 'proofs'}</span>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {proofs.map((proof) => (
              <motion.div
                key={proof.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative rounded-xl overflow-hidden border-2 border-gray-100 hover:border-green-400 transition-colors cursor-pointer bg-gray-50"
                onClick={() => setSelectedProof(proof)}
              >
                {/* Proof Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={proof.proofImageUrl}
                    alt={`Proof by ${proof.user.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Time badge */}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
                  {getTimeAgo(proof.proofUploadedAt || proof.completedAt || 0)}
                </div>

                {/* Expiration badge */}
                {proof.proofExpiresAt && (
                  <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md">
                    {getDaysLeft(proof.proofExpiresAt)}d left
                  </div>
                )}

                {/* User + Challenge info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2.5 pt-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    {proof.user.profileImage ? (
                      <img
                        src={proof.user.profileImage}
                        alt={proof.user.name}
                        className="w-5 h-5 rounded-full object-cover border border-white/50"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/50"
                        style={{
                          background: proof.user.avatarColor || 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                        }}
                      >
                        {proof.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-white text-xs font-semibold truncate">
                      {proof.user.name || 'Anonymous'}
                    </span>
                  </div>
                  <div className="text-white/80 text-[11px] leading-tight truncate">
                    {proof.task.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 text-center">
              Proofs are visible for 7 days after submission
            </p>
          </div>
        </div>
      )}

      {/* Proof Lightbox */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <img
                src={selectedProof.proofImageUrl}
                alt={`Proof by ${selectedProof.user.name}`}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />

              {/* Details below image */}
              <div className="p-4 space-y-3">
                {/* User info */}
                <div className="flex items-center gap-2">
                  {selectedProof.user.profileImage ? (
                    <img
                      src={selectedProof.user.profileImage}
                      alt={selectedProof.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        background: selectedProof.user.avatarColor || 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                      }}
                    >
                      {selectedProof.user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {selectedProof.user.name || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeAgo(selectedProof.proofUploadedAt || selectedProof.completedAt || 0)}
                      {selectedProof.proofExpiresAt && (
                        <span className="ml-2 text-amber-600">
                          {getDaysLeft(selectedProof.proofExpiresAt)}d left
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Associated challenge */}
                <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-purple-500 font-medium">Challenge</div>
                    <div className="text-sm font-semibold text-purple-900 truncate">
                      {selectedProof.task.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collective Moments */}
      {collectiveMoments.length > 0 && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-3">
            Collective Moments
          </h3>
          <div className="space-y-2">
            {collectiveMoments.map((moment) => (
              <div
                key={moment.taskId}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {moment.count} people completed
                    </div>
                    <div className="text-sm text-gray-600">
                      "{moment.taskTitle}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Completions</h3>
        </div>

        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {recentCompletions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No completions yet. Be the first!
            </div>
          ) : (
            recentCompletions.map((completion) => (
              <div
                key={completion.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* User avatar */}
                    {completion.user.profileImage ? (
                      <img
                        src={completion.user.profileImage}
                        alt={completion.user.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: completion.user.avatarColor || 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
                        }}
                      >
                        {completion.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="text-sm min-w-0">
                      <span className="font-semibold text-gray-900">
                        {completion.user.name || 'Someone'}
                      </span>{' '}
                      <span className="text-gray-600">completed</span>{' '}
                      <span className="font-semibold text-purple-600">
                        {completion.task.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {/* Proof indicator */}
                    {completion.proofImageUrl && !(completion.proofExpiresAt && Date.now() > completion.proofExpiresAt) && (
                      <button
                        onClick={() => setSelectedProof(completion)}
                        className="text-green-500 hover:text-green-600 transition-colors"
                        title="View proof"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    <div className="text-xs text-gray-400">
                      {getTimeAgo(completion.completedAt || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
