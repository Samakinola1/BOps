'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !companyName) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0b0c10] via-[#1f2833] to-[#0b0c10] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
          <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-[#45f3ff]/20 py-10 px-6 shadow-2xl rounded-2xl sm:px-10 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-[#86c232] animate-bounce" />
            </div>
            <h2 className="text-3xl font-extrabold text-white">Verify Your Email</h2>
            <p className="text-[#c5c6c7]">
              Registration complete! We have sent a verification link to <span className="font-semibold text-white">{email}</span>.
            </p>
            <p className="text-sm text-gray-400">
              Please click the link in the email to activate your account and configure your business operations settings.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200"
              >
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0b0c10] via-[#1f2833] to-[#0b0c10] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45f3ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6f42c1] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-[#c5c6c7] to-[#45f3ff]">
          Register Business
        </h2>
        <p className="mt-2 text-center text-sm text-[#86c232] font-semibold">
          Create your custom business operations workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-[#1a1a24]/60 backdrop-blur-xl border border-[#45f3ff]/20 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm transition-all duration-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
                Company / Business Name
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
                Your Name
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#c5c6c7]">
                Password
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#0f0f15]/80 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#45f3ff] focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-[#0b0c10] bg-gradient-to-r from-[#45f3ff] to-[#6f42c1] hover:from-[#c5c6c7] hover:to-[#45f3ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#45f3ff] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    Register & Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-gray-800/80 pt-4">
            <p className="text-sm text-[#c5c6c7]">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-[#45f3ff] hover:text-white transition-colors duration-200"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
