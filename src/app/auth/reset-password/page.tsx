'use client';

/**
 * Reset Password Page
 * 
 * Allows users to set a new password after clicking the reset link in email.
 * 
 * SECURITY:
 * - Token validated by Supabase
 * - Password strength enforced
 * - Session created on success
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Password strength indicators
  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isPasswordValid = passwordStrength.hasMinLength && passwordStrength.hasNumber && passwordStrength.hasLetter;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Check if we have a valid session (from the reset email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionValid(!!session);
    };
    
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Invalid or expired link
  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-6">
        <div className="texture-subtle" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="card-elevated text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="font-display text-display-sm text-stone-800 mb-2">
              Invalid or expired link
            </h1>
            <p className="text-stone-500 mb-6">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            <Link href="/forgot-password" className="btn-primary inline-flex justify-center">
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (sessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center p-6">
        <div className="texture-subtle" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="card-elevated text-center">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-sage-600" />
            </div>
            <h1 className="font-display text-display-sm text-stone-800 mb-2">
              Password updated!
            </h1>
            <p className="text-stone-500 mb-6">
              Your password has been successfully reset. Redirecting to dashboard...
            </p>
            <div className="flex items-center justify-center gap-2 text-sage-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting...</span>
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
          <h1 className="font-display text-display-sm text-stone-800 mb-2">
            Set new password
          </h1>
          <p className="text-stone-500 mb-8">
            Choose a strong password for your account.
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="input-label">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="input-base pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Requirements */}
              {password && (
                <div className="mt-3 space-y-1">
                  <PasswordRequirement met={passwordStrength.hasMinLength} text="At least 8 characters" />
                  <PasswordRequirement met={passwordStrength.hasLetter} text="Contains a letter" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="Contains a number" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="input-label">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="input-base pl-11"
                />
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-stone-400'}`}>
      {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );
}
