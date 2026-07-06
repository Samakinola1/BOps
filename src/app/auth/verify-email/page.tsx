'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing.');
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setSuccess(true);
        } else {
          setError(data.error || 'Verification failed');
        }
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
      <div className="space-y-6 text-center py-6">
        <div className="flex justify-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#45f3ff]" />
        </div>
        <h3 className="text-xl font-bold text-white">Verifying your email...</h3>
        <p className="text-sm text-[#c5c6c7]">
          Please wait while we activate your business workspace.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-[#86c232] animate-bounce" />
        </div>
        <h3 className="text-2xl font-bold text-white">Verification Complete</h3>
        <p className="text-sm text-[#c5c6c7]">
          Thank you! Your email address has been successfully verified. Your business workspace is now active.
        </p>
        <div className="pt-4">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200"
          >
            Sign In to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <XCircle className="h-16 w-16 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold text-white">Verification Failed</h3>
      <p className="text-sm text-red-200 bg-red-950/40 border border-red-500/30 p-3 rounded-lg">
        {error}
      </p>
      <p className="text-xs text-gray-400">
        The link may have expired or already been used. Please try registering again or requesting a new reset token.
      </p>
      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/auth/register"
          className="inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gray-800 hover:bg-gray-700 transition-all duration-200"
        >
          Register Again
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0b0c10] via-[#1f2833] to-[#0b0c10] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-[#c5c6c7] to-[#45f3ff]">
          Email Verification
        </h2>
        <p className="mt-2 text-center text-sm text-[#86c232] font-semibold">
          Activating your account profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-[#45f3ff]/20 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <Suspense fallback={
            <div className="flex flex-col items-center py-10 justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff]" />
              <p className="mt-4 text-[#c5c6c7] text-sm">Loading verification details...</p>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
