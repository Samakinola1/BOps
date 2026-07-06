import Link from 'next/link';
import { ArrowRight, Briefcase, Key, ShieldCheck, Database, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0b0c10] text-[#c5c6c7] relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#45f3ff] rounded-full blur-[200px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6f42c1] rounded-full blur-[200px] opacity-10 pointer-events-none" />

      {/* Header/Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-gray-800/60 z-10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-[#45f3ff] to-[#6f42c1] flex items-center justify-center text-[#0b0c10] font-bold text-xl shadow-lg">
            BO
          </div>
          <span className="font-extrabold text-white text-xl tracking-tight">Ops Suite</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200"
          >
            Register Business
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 z-10 py-16 lg:py-24">
        {/* Left text column */}
        <div className="flex-1 flex flex-col space-y-6 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Integrated Business{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#45f3ff] to-[#6f42c1]">
              Operations Suite
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
            A comprehensive, premium workspace for authentication, business configurations, customers, products, quotations, expenses, and automated invoicing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center py-4 px-8 border border-transparent rounded-xl shadow-lg text-md font-semibold text-[#0b0c10] bg-[#45f3ff] hover:bg-[#c5c6c7] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center py-4 px-8 border border-gray-700 rounded-xl text-md font-semibold text-white bg-gray-800/40 hover:bg-gray-700/60 transition-colors duration-200"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Right visual grid column */}
        <div className="flex-1 w-full max-w-md lg:max-w-none grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[#1a1a24]/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="h-10 w-10 rounded-lg bg-[#45f3ff]/10 flex items-center justify-center text-[#45f3ff] mb-4">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Secure Authentication</h3>
              <p className="text-sm text-gray-400 mt-2">Custom JWT validation with HttpOnly session cookies, email verification, and recovery.</p>
            </div>
          </div>

          <div className="bg-[#1a1a24]/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="h-10 w-10 rounded-lg bg-[#6f42c1]/10 flex items-center justify-center text-[#6f42c1] mb-4">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Business Config</h3>
              <p className="text-sm text-gray-400 mt-2">Custom currency, prefix sequencing, tax details, and dynamic logo upload management.</p>
            </div>
          </div>

          <div className="bg-[#1a1a24]/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="h-10 w-10 rounded-lg bg-[#86c232]/10 flex items-center justify-center text-[#86c232] mb-4">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Robust Database</h3>
              <p className="text-sm text-gray-400 mt-2">Structured relational schema built on Prisma ORM and SQLite, fully prepared for PostgreSQL.</p>
            </div>
          </div>

          <div className="bg-[#1a1a24]/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div className="h-10 w-10 rounded-lg bg-[#e84a5f]/10 flex items-center justify-center text-[#e84a5f] mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Modular Design</h3>
              <p className="text-sm text-gray-400 mt-2">Ready to expand with Customer management, Quotes, Invoices, Expenses, and Dashboard widgets.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/60 py-6 text-center text-xs text-gray-500 z-10">
        &copy; {new Date().getFullYear()} Business Operations Suite. All rights reserved.
      </footer>
    </div>
  );
}
