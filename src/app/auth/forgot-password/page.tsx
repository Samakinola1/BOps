'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0b0c10] via-[#1f2833] to-[#0b0c10] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-[#c5c6c7] to-[#45f3ff]">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-[#86c232] font-semibold">
          Recover your business operations account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-[#45f3ff]/20 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[#86c232]/20 flex items-center justify-center text-[#86c232]">
                  <Send className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white">Reset Link Sent</h3>
              <p className="text-sm text-[#c5c6c7]">
                If the email <span className="font-semibold text-white">{email}</span> exists in our database, we have sent a reset password link to it.
              </p>
              <p className="text-xs text-gray-400">
                Please check your inbox (and spam folder) and click the link to set a new password.
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm font-semibold text-[#45f3ff] hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm transition-all duration-300">
                  {error}
                </div>
              )}

              <p className="text-sm text-[#c5c6c7] text-center">
                Enter your email address below and we will send you a mock link to reset your account password.
              </p>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
                  Email Address
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#45f3ff] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel and return to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
