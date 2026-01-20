'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OGData {
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  favicon: string;
  domain: string;
}

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract domain from URL for immediate display
  const getDomain = (url: string): string => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const domain = getDomain(url);

  // Fetch OG data
  useEffect(() => {
    const fetchOGData = async () => {
      try {
        const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          setOgData(data);
        }
      } catch (error) {
        console.error('Failed to fetch OG data:', error);
      }
    };

    fetchOGData();
  }, [url]);

  // Handle hover with slight delay
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(false);
  };

  // Handle long press for mobile
  const handleTouchStart = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Domain Chip */}
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        whileTap={{ scale: 0.97 }}
        animate={{
          backgroundColor: isPressed ? 'rgb(226 232 240)' : 'rgb(248 250 252)',
        }}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 group"
      >
        {/* Favicon */}
        {!faviconError && ogData?.favicon ? (
          <img
            src={ogData.favicon}
            alt=""
            className="w-4 h-4 rounded-sm"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-slate-200 flex items-center justify-center">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
        )}

        {/* Domain */}
        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
          {domain}
        </span>

        {/* External Link Icon */}
        <svg
          className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </motion.a>

      {/* Live Preview Popover */}
      <AnimatePresence>
        {isHovering && ogData && (ogData.title || ogData.description) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            className="absolute left-0 top-full mt-2 z-50"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-72">
              {/* Preview Card Content */}
              <div className="p-4">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {ogData.image && !imageError && (
                    <div className="flex-shrink-0">
                      <img
                        src={ogData.image}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    {/* Site Name */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {!faviconError && ogData.favicon && (
                        <img
                          src={ogData.favicon}
                          alt=""
                          className="w-3.5 h-3.5 rounded-sm"
                          onError={() => setFaviconError(true)}
                        />
                      )}
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {ogData.siteName || domain}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                      {ogData.title}
                    </h4>

                    {/* Description */}
                    {ogData.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {ogData.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Click to open</span>
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
