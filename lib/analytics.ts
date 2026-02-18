import posthog from 'posthog-js';

// Initialize PostHog only if token is provided
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: false, // Manual tracking for better control
    capture_pageview: false, // We'll track pageviews manually
    capture_pageleave: true,
    session_recording: {
      recordCrossOriginIframes: true,
    },
  });
}

// Event types for type safety
export type AnalyticsEvent =
  // Auth events
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'profile_completed'
  | 'profile_updated'
  | 'avatar_uploaded'

  // Task events
  | 'task_created'
  | 'task_viewed'
  | 'task_executed'
  | 'task_completed'
  | 'task_uncompleted'

  // Friend events
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'friend_request_ignored'
  | 'friend_removed'
  | 'friend_searched'

  // Challenge events
  | 'challenge_sent'
  | 'challenge_accepted'
  | 'challenge_declined'
  | 'challenge_completed'
  | 'challenge_modal_opened'

  // Navigation events
  | 'tab_viewed'
  | 'page_viewed'

  // Engagement events
  | 'comment_created'
  | 'external_link_clicked'
  | 'pulse_viewed'
  | 'collective_moment_viewed'
  | 'streak_achieved';

// Track custom events
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[analytics] ${event}`, properties ?? '');
  }

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.capture(event, properties);
}

// Identify user with traits
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    name?: string;
    createdAt?: number;
    profileImage?: string;
    avatarColor?: string;
  }
) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.identify(userId, traits);
}

// Set user properties (for updating existing users)
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.people.set(properties);
}

// Track page views
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.capture('$pageview', {
    $current_url: window.location.href,
    page_name: pageName,
    ...properties,
  });
}

// Start session tracking
export function startSession() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.capture('session_started', {
    referrer: document.referrer,
    url: window.location.href,
  });
}

// Reset on logout
export function resetAnalytics() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.reset();
}

// Get distinct ID (for debugging)
export function getDistinctId() {
  if (typeof window === 'undefined') return null;

  return posthog.get_distinct_id();
}

// Feature flags (for A/B testing later)
export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === 'undefined') return false;

  return posthog.isFeatureEnabled(flag) ?? false;
}

// Export posthog instance for advanced usage
export { posthog };
