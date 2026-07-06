'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email address is required.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) { setSuccess(true); }
      else {
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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }} />
      <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-[0.05] pointer-events-none animate-float-reverse"
        style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg animate-gradient-shift"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'var(--bg-primary)' }}>
            BO
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight gradient-text">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
          Recover your business operations account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 shadow-2xl sm:px-10">
          {success ? (
            <div className="space-y-6 text-center animate-scale-in-bounce">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--success-bg)' }}>
                    <Send className="h-7 w-7" style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="absolute inset-0 rounded-full animate-glow-ring" />
                </div>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reset Link Sent</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If the email <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{email}</span> exists in our database, we have sent a reset password link to it.
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Please check your inbox (and spam folder) and click the link to set a new password.
              </p>
              <div className="pt-4">
                <Link href="/auth/login"
                  className="inline-flex items-center text-sm font-semibold transition-colors duration-200 hover:brightness-125"
                  style={{ color: 'var(--accent-primary)' }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-down"
                  style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
                  {error}
                </div>
              )}

              <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                Enter your email address below and we will send you a link to reset your password.
              </p>

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
                  <input id="email" name="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input-field input-with-icon" placeholder="name@company.com" />
                </div>
              </div>

              <div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 rounded-xl text-sm">
                  {submitting ? (
                    <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Sending Link...</>
                  ) : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/auth/login"
                  className="inline-flex items-center text-sm font-medium transition-colors duration-200"
                  style={{ color: 'var(--text-tertiary)' }}>
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
