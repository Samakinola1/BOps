'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Verification token is missing.'); setVerifying(false); return; }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (res.ok) { setSuccess(true); }
        else { setError(data.error || 'Verification failed'); }
      } catch (err) {
        setError('Network error occurred. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  if (verifying) {
    return (
      <div className="space-y-6 text-center py-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <div className="absolute inset-[-8px] rounded-full border-2 animate-glow-ring"
              style={{ borderColor: 'rgba(var(--accent-primary-rgb), 0.2)' }} />
          </div>
        </div>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Verifying your email...</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Please wait while we activate your business workspace.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-scale-in-bounce">
        <div className="flex justify-center">
          <div className="relative">
            <ShieldCheck className="h-16 w-16" style={{ color: 'var(--success)' }} />
            <div className="absolute inset-0 rounded-full animate-glow-ring" />
          </div>
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Verification Complete</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Thank you! Your email address has been successfully verified. Your business workspace is now active.
        </p>
        <div className="pt-4">
          <Link href="/auth/login" className="btn-primary px-6 py-3 rounded-xl text-sm">
            Sign In to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center animate-fade-in-up">
      <div className="flex justify-center">
        <XCircle className="h-16 w-16" style={{ color: 'var(--error)' }} />
      </div>
      <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Verification Failed</h3>
      <div className="px-4 py-3 rounded-xl text-sm"
        style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
        {error}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        The link may have expired or already been used. Please try registering again or requesting a new token.
      </p>
      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/auth/register" className="btn-secondary px-6 py-3 rounded-xl text-sm">
          Register Again
        </Link>
        <Link href="/auth/login" className="btn-primary px-6 py-3 rounded-xl text-sm">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
        <h2 className="text-center text-3xl font-black tracking-tight gradient-text">Email Verification</h2>
        <p className="mt-2 text-center text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
          Activating your account profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 shadow-2xl sm:px-10">
          <Suspense fallback={
            <div className="flex flex-col items-center py-10 justify-center">
              <Loader2 className="animate-spin h-10 w-10" style={{ color: 'var(--accent-primary)' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading verification...</p>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
