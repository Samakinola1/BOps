'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserCheck, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); setErrorMsg('No invitation token was found in the URL.'); return; }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/accept-invite?token=${token}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setValidToken(true);
          setEmail(data.email);
          setBusinessName(data.businessName);
        } else {
          setErrorMsg(data.error || 'This invitation is invalid or has expired.');
        }
      } catch (err) {
        setErrorMsg('Network error verifying invitation token.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) { setErrorMsg('All fields are required.'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters long.'); return; }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Invitation accepted! Redirecting to login...');
        setTimeout(() => { router.push('/auth/login'); }, 3000);
      } else {
        setErrorMsg(data.error || 'Failed to accept invitation.');
      }
    } catch (err) {
      setErrorMsg('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="relative">
          <Loader2 className="animate-spin h-10 w-10 mb-4" style={{ color: 'var(--accent-primary)' }} />
          <div className="absolute inset-[-6px] rounded-full animate-glow-ring" />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Verifying team invitation token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.05] pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.05] pointer-events-none animate-float-reverse"
        style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)' }} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg animate-gradient-shift"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'var(--bg-primary)' }}>
            BO
          </div>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
          Team Invitation
        </h2>
        {validToken && (
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            You have been invited to join <span className="font-extrabold" style={{ color: 'var(--accent-primary)' }}>{businessName}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 sm:px-10 shadow-2xl">
          {errorMsg && !successMsg && (
            <div className="mb-6 flex items-center px-4 py-3 rounded-xl text-xs font-medium animate-fade-in-down"
              style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
              <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-center px-4 py-3 rounded-xl text-xs font-medium animate-scale-in-bounce"
              style={{ background: 'var(--success-bg)', border: '1px solid rgba(52, 211, 153, 0.3)', color: 'var(--success)' }}>
              <UserCheck className="h-5 w-5 mr-2 shrink-0" />
              {successMsg}
            </div>
          )}

          {validToken && !successMsg ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <input type="email" disabled value={email} className="input-field opacity-50 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name" className="input-field" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Choose Password
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="input-field pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                    style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Confirm Password
                </label>
                <input type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="input-field" />
              </div>

              <div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 rounded-xl text-sm">
                  {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-1" /> : (
                    <>Accept & Set Password <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {!successMsg ? 'Please ask your administrator to send you a new invitation link.' : 'You will be redirected shortly...'}
              </p>
              <div className="pt-4">
                <Link href="/auth/login" className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-primary)' }}>
                  Return to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="animate-spin h-10 w-10 mb-4" style={{ color: 'var(--accent-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading accept invite page...</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
