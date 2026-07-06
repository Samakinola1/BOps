'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Loader2, Key, UserCheck, AlertCircle } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('No invitation token was found in the URL.');
      return;
    }

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
    if (!name.trim() || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

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
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0c10]">
        <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff] mb-4" />
        <p className="text-sm text-gray-400">Verifying team invitation token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#45f3ff]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#6f42c1]/5 blur-[120px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#45f3ff] to-[#6f42c1] flex items-center justify-center text-[#0b0c10] font-black text-2xl shadow-lg shadow-[#45f3ff]/10">
            BO
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight uppercase">
          Ops Suite invitation
        </h2>
        {validToken && (
          <p className="mt-2 text-center text-sm text-gray-400">
            You have been invited to join <span className="text-[#45f3ff] font-extrabold">{businessName}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#1a1a24]/60 border border-gray-800 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl backdrop-blur-md">
          {errorMsg && !successMsg && (
            <div className="mb-6 bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-xs flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-950/50 border border-[#86c232]/50 text-[#86c232] px-4 py-3 rounded-lg text-xs flex items-center">
              <UserCheck className="h-5 w-5 mr-2 shrink-0" />
              {successMsg}
            </div>
          )}

          {validToken && !successMsg ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Email Address</label>
                <div className="mt-2">
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="block w-full px-4 py-3 bg-gray-900/40 border border-gray-800 rounded-lg text-gray-500 text-sm focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Full Name</label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Choose Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">Confirm Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-4 py-3 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#45f3ff]"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-1" /> : 'Accept & Set Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <p className="text-sm text-gray-400">
                {!successMsg ? 'Please ask your administrator to send you a new invitation link.' : 'You will be redirected shortly...'}
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="text-xs text-[#45f3ff] hover:underline font-bold font-mono uppercase"
                >
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0c10]">
        <Loader2 className="animate-spin h-10 w-10 text-[#45f3ff] mb-4" />
        <p className="text-sm text-gray-400">Loading accept invite page...</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
