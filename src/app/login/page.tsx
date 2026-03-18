'use client';

/**
 * Login Page
 * 
 * Handles user authentication via:
 * - Email/Password
 * - Google OAuth
 * 
 * SECURITY:
 * - All auth handled by Supabase
 * - Passwords never stored locally
 * - HTTPS enforced in production
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // SECURITY: Validate redirectTo to prevent open redirect attacks
  const rawRedirectTo = searchParams.get('redirectTo') || '/dashboard';
  const redirectTo = isValidRedirectPath(rawRedirectTo) ? rawRedirectTo : '/dashboard';
  const authError = searchParams.get('error');

// Security helper to prevent open redirects
function isValidRedirectPath(path: string): boolean {
  // Only allow relative paths starting with /
  // Block: absolute URLs, protocol-relative URLs, javascript:, data:
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.includes(':')) return false; // Blocks javascript:, data:, https:
  if (path.includes('\\')) return false; // Blocks backslash tricks
  // Only allow alphanumeric, /, -, _, ?, =, &
  return /^\/[a-zA-Z0-9\-_\/\?=&]*$/.test(path);
}

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  // Show auth error from callback
  useEffect(() => {
    if (authError === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [authError]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in');
        } else {
          setError(error.message);
        }
      } else {
        router.push(redirectTo);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // If successful, user will be redirected by OAuth flow
    } catch {
      setError('Failed to connect to Google');
      setLoading(false);
    }
  };

  // Don't render until we know auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-6">
      <div className="texture-subtle" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sage-500 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl text-stone-700">Aythya Strategy</span>
        </div>

        {/* Card */}
        <div className="card-elevated">
          <h1 className="font-display text-display-sm text-stone-800 text-center mb-2">
            Welcome back
          </h1>
          <p className="text-stone-500 text-center mb-8">
            Sign in to continue your strategic planning
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-stone-700">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-sm text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="input-base pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="input-label mb-0">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-sage-600 hover:text-sage-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  minLength={8}
                  className="input-base pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-stone-500">
            Don't have an account?{' '}
            <Link
              href={`/signup${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-sage-600 hover:text-sage-700 font-medium"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-stone-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-stone-600">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-stone-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
