'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/db';
import { getDistinctId, posthog } from '@/lib/analytics';

export default function DebugAnalytics() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [distinctId, setDistinctId] = useState<string | null>(null);
  const [posthogConfig, setPosthogConfig] = useState<any>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getDistinctId();
      setDistinctId(id);

      // Get PostHog config info
      setPosthogConfig({
        isInitialized: !!posthog,
        hasApiKey: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
        apiKeyPrefix: process.env.NEXT_PUBLIC_POSTHOG_KEY?.substring(0, 10) + '...',
        apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">PostHog Debug Info</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Home
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">User Information</h2>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold w-40">User ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {user?.id || 'Not signed in'}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold w-40">Email:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {user?.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* PostHog Config */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">PostHog Configuration</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-semibold w-40">Initialized:</span>
                <span className={`px-2 py-1 rounded ${posthogConfig.isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {posthogConfig.isInitialized ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">API Key Set:</span>
                <span className={`px-2 py-1 rounded ${posthogConfig.hasApiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {posthogConfig.hasApiKey ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              {posthogConfig.hasApiKey && (
                <div className="flex">
                  <span className="font-semibold w-40">API Key:</span>
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {posthogConfig.apiKeyPrefix}
                  </span>
                </div>
              )}
              <div className="flex">
                <span className="font-semibold w-40">API Host:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {posthogConfig.apiHost || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* PostHog Distinct ID */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">PostHog Tracking</h2>
            <div className="space-y-2">
              <div className="flex">
                <span className="font-semibold w-40">Distinct ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                  {distinctId || 'Not available'}
                </span>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Expected behavior:</strong> The distinct_id should match your User ID after you sign in.
                  If all users have the same distinct_id, that's the problem.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Diagnostic Checklist</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className={`mt-1 ${posthogConfig.hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                  {posthogConfig.hasApiKey ? '✓' : '✗'}
                </span>
                <div>
                  <div className="font-semibold">PostHog API Key is configured</div>
                  <div className="text-sm text-gray-600">
                    {posthogConfig.hasApiKey ? 'Environment variable is set' : 'Need to set NEXT_PUBLIC_POSTHOG_KEY in .env.local'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className={`mt-1 ${posthogConfig.isInitialized ? 'text-green-600' : 'text-red-600'}`}>
                  {posthogConfig.isInitialized ? '✓' : '✗'}
                </span>
                <div>
                  <div className="font-semibold">PostHog is initialized</div>
                  <div className="text-sm text-gray-600">
                    {posthogConfig.isInitialized ? 'PostHog SDK is loaded' : 'PostHog failed to initialize'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className={`mt-1 ${distinctId && user?.id ? (distinctId === user.id ? 'text-green-600' : 'text-yellow-600') : 'text-gray-400'}`}>
                  {distinctId && user?.id ? (distinctId === user.id ? '✓' : '⚠') : '○'}
                </span>
                <div>
                  <div className="font-semibold">User is identified correctly</div>
                  <div className="text-sm text-gray-600">
                    {!user ? 'Not signed in' :
                     !distinctId ? 'Distinct ID not available' :
                     distinctId === user.id ? 'Distinct ID matches user ID' :
                     'Distinct ID does not match user ID - identification may not be working'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-900">How to Fix Low DAU/WAU</h2>
            <div className="space-y-2 text-sm text-yellow-900">
              <p><strong>1. Check if distinct_id matches user ID above</strong></p>
              <p className="ml-4">If they don't match, user identification isn't working properly.</p>

              <p className="mt-3"><strong>2. Sign in with different accounts</strong></p>
              <p className="ml-4">Check if each account gets a unique distinct_id in PostHog.</p>

              <p className="mt-3"><strong>3. Check PostHog Person Merge settings</strong></p>
              <p className="ml-4">Go to PostHog → Project Settings → Person Display Name → Make sure "Automatically merge persons" is configured correctly.</p>

              <p className="mt-3"><strong>4. Verify events in PostHog</strong></p>
              <p className="ml-4">Go to PostHog → Activity → Live Events to see if events are coming through with unique distinct_ids.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
