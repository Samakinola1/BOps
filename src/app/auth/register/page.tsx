'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--error)' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'var(--warning)' };
    return { score: 3, label: 'Strong', color: 'var(--success)' };
  }, [password]);

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
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.06] pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-[0.05] pointer-events-none animate-float-reverse"
          style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)' }} />

        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
          <div className="glass-card-elevated py-10 px-6 shadow-2xl sm:px-10 text-center space-y-6 animate-scale-in-bounce">
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircle2 className="h-16 w-16 animate-fade-in-up" style={{ color: 'var(--success)' }} />
                <div className="absolute inset-0 rounded-full animate-glow-ring" />
              </div>
            </div>
            <h2 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Verify Your Email</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Registration complete! We have sent a verification link to <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{email}</span>.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Please click the link in the email to activate your account and configure your business operations settings.
            </p>
            <div className="pt-4">
              <Link href="/auth/login" className="btn-primary px-6 py-3 rounded-xl text-sm">
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          Register Business
        </h2>
        <p className="mt-2 text-center text-sm font-semibold" style={{ color: 'var(--accent-tertiary)' }}>
          Create your custom business operations workspace
        </p>
      </div>

      {/* Form card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0 animate-fade-in-up delay-100">
        <div className="glass-card-elevated py-8 px-6 shadow-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center px-4 py-3 rounded-xl text-sm font-medium animate-fade-in-down"
                style={{ background: 'var(--error-bg)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--error)' }}>
                {error}
              </div>
            )}

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                Company / Business Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Briefcase className="h-[18px] w-[18px] transition-colors duration-200"
                    style={{ color: companyName ? 'var(--accent-secondary)' : 'var(--text-muted)' }} />
                </div>
                <input id="companyName" name="companyName" type="text" required
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field input-with-icon" placeholder="Acme Corp" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-[18px] w-[18px] transition-colors duration-200"
                    style={{ color: name ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                </div>
                <input id="name" name="name" type="text" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field input-with-icon" placeholder="John Doe" />
              </div>
            </div>

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
                <input id="email" name="email" type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-with-icon" placeholder="name@company.com" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-[18px] w-[18px] transition-colors duration-200"
                    style={{ color: password ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                </div>
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-with-icon pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors duration-200 hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: passwordStrength.score >= level ? passwordStrength.color : 'var(--border-subtle)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 rounded-xl text-sm">
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

          <div className="mt-6 text-center pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold transition-colors duration-200 hover:brightness-125"
                style={{ color: 'var(--accent-primary)' }}>
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
