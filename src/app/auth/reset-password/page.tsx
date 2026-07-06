'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-[#86c232] animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-white">Password Reset Complete</h3>
        <p className="text-sm text-[#c5c6c7]">
          Your password has been successfully updated. You can now use your new password to sign in.
        </p>
        <div className="pt-4">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm transition-all duration-300">
          {error}
        </div>
      )}

      <p className="text-sm text-[#c5c6c7] text-center">
        Enter and confirm your new password below.
      </p>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
          New Password
        </label>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={!token}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
          Confirm New Password
        </label>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-500" />
          </div>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            disabled={!token}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting || !token}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#45f3ff] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </div>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0b0c10] via-[#1f2833] to-[#0b0c10] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-[#c5c6c7] to-[#45f3ff]">
          New Password
        </h2>
        <p className="mt-2 text-center text-sm text-[#86c232] font-semibold">
          Set up a new secure password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-[#45f3ff]/20 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <Suspense fallback={
            <div className="flex flex-col items-center py-10 justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
              <p className="mt-4 text-[#c5c6c7] text-sm">Loading reset form...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
