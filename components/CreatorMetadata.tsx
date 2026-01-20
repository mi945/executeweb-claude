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
    <div className="flex items-center justify-between mb-3 gap-3">
      {/* Left side: Avatar and Username */}
      <div className="flex items-center gap-3 min-w-0">
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
          className="font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate"
        >
          {creator.name}
        </a>
      </div>

      {/* Right side: Timestamp */}
      <span className="text-gray-400 text-sm flex-shrink-0">
        {relativeTime}
      </span>
    </div>
  );
}
