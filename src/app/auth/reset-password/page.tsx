'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsMismatch = password && confirmPassword && password !== confirmPassword;

  useEffect(() => {
    if (!token) { setError('Invalid reset token. Please request a new password reset link.'); }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); }
      else { setError(data.error || 'Failed to reset password'); }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center animate-scale-in-bounce">
        <div className="flex justify-center">
          <div className="relative">
            <ShieldCheck className="h-16 w-16" style={{ color: 'var(--success)' }} />
            <div className="absolute inset-0 rounded-full animate-glow-ring" />
          </div>
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Password Reset Complete</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <div className="pt-4">
          <Link href="/auth/login" className="btn-primary px-6 py-3 rounded-xl text-sm">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-down"
          style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        Enter and confirm your new password below.
      </p>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-secondary)' }}>New Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-[18px] w-[18px] transition-colors duration-200"
              style={{ color: password ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          </div>
          <input id="password" type={showPassword ? 'text' : 'password'} required disabled={!token}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="input-field input-with-icon pr-11" placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="h-[18px] w-[18px] transition-colors duration-200"
              style={{ color: confirmPassword ? (passwordsMatch ? 'var(--success)' : passwordsMismatch ? 'var(--error)' : 'var(--accent-primary)') : 'var(--text-muted)' }} />
          </div>
          <input id="confirmPassword" type={showPassword ? 'text' : 'password'} required disabled={!token}
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field input-with-icon" placeholder="••••••••"
            style={passwordsMismatch ? { borderColor: 'var(--error)' } : passwordsMatch ? { borderColor: 'var(--success)' } : {}} />
        </div>
        {passwordsMismatch && (
          <p className="mt-1.5 text-xs font-medium animate-fade-in" style={{ color: 'var(--error)' }}>Passwords do not match</p>
        )}
        {passwordsMatch && (
          <p className="mt-1.5 text-xs font-medium animate-fade-in flex items-center" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Passwords match
          </p>
        )}
      </div>

      <div>
        <button type="submit" disabled={submitting || !token} className="btn-primary w-full py-3 rounded-xl text-sm">
          {submitting ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Resetting Password...</> : 'Reset Password'}
        </button>
      </div>

      <div className="text-center">
        <Link href="/auth/login" className="inline-flex items-center text-sm font-medium transition-colors duration-200"
          style={{ color: 'var(--text-tertiary)' }}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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
        <h2 className="text-center text-3xl font-black tracking-tight gradient-text">New Password</h2>
        <p className="mt-2 text-center text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
          Set up a new secure password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 shadow-2xl sm:px-10">
          <Suspense fallback={
            <div className="flex flex-col items-center py-10 justify-center">
              <Loader2 className="animate-spin h-10 w-10" style={{ color: 'var(--accent-primary)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading reset form...</p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
