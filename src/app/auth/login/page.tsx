'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address to resend verification.');
      return;
    }
    setResending(true);
    setError('');
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage(data.message || 'Verification link sent successfully.');
      } else {
        setError(data.error || 'Failed to resend verification link.');
      }
    } catch (err) {
      setError('Failed to resend verification link. Please check your network connection.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setResendMessage('');

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Animated floating background orbs */}
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-[0.05] pointer-events-none animate-float-reverse"
        style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)' }} />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg animate-gradient-shift"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'var(--bg-primary)' }}>
            BO
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight gradient-text">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
          Sign in to your workspace
        </p>
      </div>

      {/* Form card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 shadow-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex flex-col gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-down"
                style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
                <div>{error}</div>
                {error.includes('verify your email') && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-xs font-bold underline text-left hover:opacity-80 transition-opacity disabled:opacity-50 mt-1 cursor-pointer"
                  >
                    {resending ? 'Resending verification link...' : 'Resend verification link'}
                  </button>
                )}
              </div>
            )}

            {resendMessage && (
              <div className="flex items-center px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-down"
                style={{ background: 'rgba(69, 243, 255, 0.1)', border: '1px solid rgba(69, 243, 255, 0.3)', color: 'var(--accent-primary)' }}>
                {resendMessage}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-[18px] w-[18px] transition-colors duration-200"
                    style={{ color: email ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-icon"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold transition-colors duration-200 hover:brightness-125"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] transition-colors duration-200"
                    style={{ color: password ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors duration-200 hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3.5 rounded-xl text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-semibold transition-colors duration-200 hover:brightness-125"
                style={{ color: 'var(--accent-primary)' }}
              >
                Register your business
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
