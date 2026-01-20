'use client';

import { useState } from 'react';
import db from '@/lib/db';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
    } catch (err: any) {
      alert('Error: ' + (err.body?.message || 'Failed to send code'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
      // Auth state will update automatically
    } catch (err: any) {
      alert('Error: ' + (err.body?.message || 'Invalid code'));
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  if (sentEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Check your email
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            We sent a code to <strong>{sentEmail}</strong>
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg text-center font-mono tracking-widest"
                maxLength={6}
                autoFocus
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSentEmail('');
                setCode('');
              }}
              className="w-full text-gray-600 text-sm hover:text-gray-900 transition-colors"
            >
              Use different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3">
            Execute
          </h1>
          <p className="text-gray-600 text-lg">
            Stop scrolling. Start doing.
          </p>
        </div>

        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Get Started'}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-6">
          We'll send you a magic code to sign in
        </p>
      </div>
    </div>
  );
}
