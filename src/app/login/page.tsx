'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

type LoginRole = 'admin' | 'employee';

import { login, signup } from './actions';

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      console.log('[LOGIN][CLIENT] Sending login request...');
      const result = await login(formData);
      
      if (result?.error) {
        console.error('[LOGIN][CLIENT] Error from server:', result.error);
        setError(result.error);
        setLoading(false);
      } else {
        console.log('[LOGIN][CLIENT] Login successful, redirecting...');
      }
    } catch (err: any) {
      console.error('[LOGIN][CLIENT] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5">

      <div className="w-full max-w-[400px] space-y-6">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        {/* Card */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] px-8 py-10 space-y-6"
             style={{ boxShadow: 'var(--shadow-sm)' }}>

          {/* Header */}
          <div>
            <div className="w-10 h-10 rounded-xl bg-[var(--text-primary)] flex items-center justify-center mb-5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" fill="white"/>
                <path d="M8 12h8M12 8v8" stroke="#171717" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">
              Sign in
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Access your {role === 'admin' ? 'business dashboard' : 'schedule'}.
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-lg border border-[var(--border-default)] p-1 gap-1 bg-[var(--bg-subtle)]">
            {(['admin', 'employee'] as LoginRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
                  role === r
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={role === r ? { boxShadow: 'var(--shadow-xs)' } : {}}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@studio.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[var(--error-light)] border border-[var(--error-border)] rounded-lg p-3 text-[13px] text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!email || !password || loading}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> ...</>
                ) : (
                  'Sign in'
                )}
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  const formData = new FormData();
                  formData.append('email', email);
                  formData.append('password', password);
                  const result = await signup(formData);
                  if (result?.error) {
                    setError(result.error);
                    setLoading(false);
                  }
                }}
                className="btn-ghost flex-1 border border-[var(--border-default)]"
                disabled={!email || !password || loading}
              >
                Sign up
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[12px] text-[var(--text-muted)]">
          For customer bookings, visit your public booking link.
        </p>
      </div>
    </div>
  );
}
