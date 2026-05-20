'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { login, signup } from './actions';

type LoginRole = 'admin' | 'employee';
type AuthMode = 'login' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLogin = mode === 'login';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = isLogin ? await login(formData) : await signup(formData);

    if (result?.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl lg:grid-cols-[1fr_440px]">
          <section className="hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <Link href="/" className="inline-flex w-fit items-center">
              <Image
                src="/brand/logo-dark.svg"
                alt="Vero"
                width={120}
                height={34}
                priority
                className="h-9 w-auto"
              />
            </Link>

            <div className="max-w-md">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                {isLogin ? 'Welcome back' : 'Start free'}
              </p>
              <h1 className="text-[40px] font-bold leading-tight tracking-[-0.03em]">
                {isLogin
                  ? 'Run your bookings from one calm dashboard.'
                  : 'Create your booking workspace in minutes.'}
              </h1>
              <p className="mt-5 text-[16px] leading-relaxed text-gray-300">
                {isLogin
                  ? 'Sign in to manage appointments, staff, services, and customer reminders.'
                  : 'Set up online booking, staff schedules, and service menus without a credit card.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[12px] text-gray-300">
              {['Online booking', 'Staff schedules', 'Reminders'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft size={14} />
              Back to home
            </Link>

            <div className="mb-7">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950">
                {isLogin ? (
                  <LogIn size={20} className="text-white" />
                ) : (
                  <UserPlus size={20} className="text-white" />
                )}
              </div>
              <h2 className="text-[26px] font-bold tracking-[-0.02em] text-gray-950">
                {isLogin ? 'Log in' : 'Create your account'}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-gray-500">
                {isLogin
                  ? `Access your ${role === 'admin' ? 'business dashboard' : 'schedule'}.`
                  : 'Start free and continue to onboarding.'}
              </p>
            </div>

            {isLogin && (
              <div className="mb-5 flex rounded-xl border border-gray-100 bg-gray-50 p-1">
                {(['admin', 'employee'] as LoginRole[]).map((nextRole) => (
                  <button
                    key={nextRole}
                    type="button"
                    onClick={() => setRole(nextRole)}
                    className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all ${
                      role === nextRole
                        ? 'border border-gray-100 bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {nextRole.charAt(0).toUpperCase() + nextRole.slice(1)}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-[12px] text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary btn-block"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isLogin ? (
                  'Log in'
                ) : (
                  'Start free trial'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[13px] text-gray-500">
              {isLogin ? (
                <>
                  New to Vero?{' '}
                  <Link href="/signup" className="font-semibold text-gray-900 hover:underline">
                    Start for free
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-gray-900 hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-[12px] text-gray-400">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="hover:text-gray-600">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:text-gray-600">
                Privacy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
