'use client';

import { getRelativeTime } from '@/lib/time';

interface CreatorMetadataProps {
  creator?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: number;
}

export default function CreatorMetadata({ creator, createdAt }: CreatorMetadataProps) {
  if (!creator) {
    return null;
  }

  const relativeTime = getRelativeTime(createdAt);

  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Timestamp */}
      <span className="text-gray-400 text-sm flex-shrink-0">
        {relativeTime}
      </span>

      <span className="text-gray-400 text-sm">·</span>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {creator.profileImage ? (
          <img
            src={creator.profileImage}
            alt={creator.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white/10">
            {creator.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Username */}
      <a
        href={`/profile/${creator.id}`}
        className="font-semibold text-white hover:text-white/80 transition-colors truncate min-w-0"
      >
        {creator.name}
      </a>
    </div>
  );
}
