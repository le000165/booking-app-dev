'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { login, signup } from './actions';

type LoginRole = 'admin' | 'employee';
type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
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

    console.log(`[AUTH][${mode.toUpperCase()}] Initiating...`);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    // Call the appropriate server action
    // If it succeeds, the server action calls redirect() which Next.js handles automatically.
    // If it fails, the server action returns { error: string }.
    const result = mode === 'login' ? await login(formData) : await signup(formData);
    
    // If we reach here, the server action returned (didn't redirect)
    if (result?.error) {
      console.error(`[AUTH][${mode.toUpperCase()}] Error:`, result.error);
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[400px] space-y-6">
        
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 px-8 py-10 space-y-6 shadow-sm">
          
          {/* Header */}
          <div>
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-5">
              {mode === 'login' ? (
                <LogIn size={20} className="text-white" />
              ) : (
                <UserPlus size={20} className="text-white" />
              )}
            </div>
            <h1 className="text-[20px] font-semibold text-gray-900 tracking-tight">
              {mode === 'login' ? 'Sign in' : 'Create your account'}
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {mode === 'login' 
                ? `Access your ${role === 'admin' ? 'business dashboard' : 'schedule'}.` 
                : 'Join the booking platform for professionals.'}
            </p>
          </div>

          {/* Role Toggle (Only show in login mode) */}
          {mode === 'login' && (
            <div className="flex rounded-lg border border-gray-100 p-1 gap-1 bg-gray-50">
              {(['admin', 'employee'] as LoginRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-[12px] font-medium rounded-md transition-all ${
                    role === r
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-[12px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full h-11 flex items-center justify-center gap-2"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                'Sign in'
              ) : (
                'Start free trial'
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
            >
              {mode === 'login' 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-400">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

