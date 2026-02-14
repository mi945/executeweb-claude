type FriendEvent =
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'friend_request_ignored'
  | 'friend_removed';

export function trackEvent(event: FriendEvent, metadata?: Record<string, string>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[analytics] ${event}`, metadata ?? '');
  }
}
