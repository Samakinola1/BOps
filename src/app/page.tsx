import Link from 'next/link';
import { ArrowRight, Briefcase, Key, ShieldCheck, Database, Layers, Zap, BarChart3 } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Key,
      title: 'Secure Authentication',
      description: 'Custom JWT validation with HttpOnly session cookies, email verification, and recovery flows.',
      color: 'var(--accent-primary)',
      colorBg: 'rgba(99, 230, 255, 0.08)',
    },
    {
      icon: Briefcase,
      title: 'Business Config',
      description: 'Custom currency, prefix sequencing, tax details, team roles, and dynamic logo management.',
      color: 'var(--accent-secondary)',
      colorBg: 'rgba(167, 139, 250, 0.08)',
    },
    {
      icon: Database,
      title: 'Robust Database',
      description: 'Structured relational schema built on Prisma ORM with backups, audit trails, and data integrity.',
      color: 'var(--accent-tertiary)',
      colorBg: 'rgba(52, 211, 153, 0.08)',
    },
    {
      icon: Layers,
      title: 'Modular Design',
      description: 'Customer management, quotations, invoices, expenses, and inventory — all seamlessly integrated.',
      color: '#f87171',
      colorBg: 'rgba(248, 113, 113, 0.08)',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Server-side rendering with Next.js, optimistic updates, and instant page transitions.',
      color: '#fbbf24',
      colorBg: 'rgba(251, 191, 36, 0.08)',
    },
    {
      icon: BarChart3,
      title: 'Analytics Ready',
      description: 'Built-in dashboard hub with revenue tracking, expense breakdowns, and visual insights.',
      color: '#fb923c',
      colorBg: 'rgba(251, 146, 60, 0.08)',
    },
  ];

  const stats = [
    { label: 'Modules', value: '8+' },
    { label: 'API Routes', value: '35+' },
    { label: 'Features', value: '50+' },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated floating background orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-[0.06] pointer-events-none animate-float-reverse"
        style={{ background: 'radial-gradient(circle, var(--accent-secondary), transparent 70%)' }} />
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full opacity-[0.04] pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, var(--accent-tertiary), transparent 70%)', animationDelay: '2s' }} />

      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10 animate-fade-in-down">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg animate-gradient-shift"
            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'var(--bg-primary)' }}>
            BO
          </div>
          <span className="font-extrabold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Ops Suite</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/auth/login"
            className="text-sm font-semibold transition-colors duration-200 hover:text-white"
            style={{ color: 'var(--text-secondary)' }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="btn-primary px-5 py-2.5 text-sm rounded-xl"
          >
            Register Business
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 z-10 py-16 lg:py-24">
        {/* Left text column */}
        <div className="flex-1 flex flex-col space-y-7 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] animate-fade-in-up"
            style={{ color: 'var(--text-primary)' }}>
            Integrated Business{' '}
            <span className="gradient-text-animated">
              Operations Suite
            </span>
          </h1>
          <p className="text-lg max-w-xl mx-auto lg:mx-0 animate-fade-in-up delay-100"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            A comprehensive, premium workspace for authentication, business configurations, customers, products, quotations, expenses, and automated invoicing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2 animate-fade-in-up delay-200">
            <Link
              href="/auth/register"
              className="btn-primary py-4 px-8 text-base rounded-xl font-bold"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2.5" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary py-4 px-8 text-base rounded-xl font-semibold"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center lg:justify-start gap-8 pt-6 animate-fade-in-up delay-300">
            {stats.map((stat, i) => (
              <div key={i} className="text-center lg:text-left">
                <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right visual grid column */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`glass-card-interactive p-6 flex flex-col justify-between animate-fade-in-up`}
              style={{ animationDelay: `${150 + index * 100}ms` }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300"
                style={{ background: feature.colorBg, color: feature.color }}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1.5" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Trust bar */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-8 z-10 animate-fade-in-up delay-700">
        <div className="glass-card px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--accent-tertiary)' }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              End-to-end secure
            </span>
          </div>
          <div className="h-4 w-px hidden sm:block" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            JWT Auth • HttpOnly Cookies • Bcrypt Hashing • Role-Based Access • Session Timeout • Audit Trails
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 text-center z-10" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Business Operations Suite. Built with Next.js, Prisma, and React.
        </p>
      </footer>
    </div>
  );
}
