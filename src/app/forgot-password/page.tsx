'use client';

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email.
 * 
 * SECURITY:
 * - Rate limited by Supabase
 * - No user enumeration (same message for existing/non-existing emails)
 * - Email sent via Supabase Auth
 */

import { useState } from 'react';
import Link from 'next/link';
import { Leaf, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        // Don't reveal if email exists or not (security)
        console.error('Password reset error:', error);
      }
      
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-6">
        <div className="texture-subtle" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="card-elevated text-center">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-sage-600" />
            </div>
            <h1 className="font-display text-display-sm text-stone-800 mb-2">
              Check your email
            </h1>
            <p className="text-stone-500 mb-6">
              If an account exists for <strong className="text-stone-700">{email}</strong>, 
              we've sent a password reset link. Please check your inbox and spam folder.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="btn-primary inline-flex w-full justify-center">
                Back to login
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="text-sm text-sage-600 hover:text-sage-700"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
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
          <Link 
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <h1 className="font-display text-display-sm text-stone-800 mb-2">
            Reset your password
          </h1>
          <p className="text-stone-500 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">
                Email address
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
                  autoFocus
                  className="input-base pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-stone-500">
            Remember your password?{' '}
            <Link href="/login" className="text-sage-600 hover:text-sage-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
