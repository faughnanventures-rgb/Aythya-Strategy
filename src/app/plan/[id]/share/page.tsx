'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  ArrowLeft,
  Copy,
  Check,
  Link2,
  Mail,
  MessageCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import { getStorageAdapter } from '@/lib/storage/adapter';
import type { StrategicPlan } from '@/types';

// Generate a cryptographically secure share token
function generateShareToken(): string {
  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(18); // 18 bytes = 24 base64 chars
    crypto.getRandomValues(array);
    // Convert to URL-safe base64
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  // Fallback to crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  
  // Last resort fallback (should never hit in modern browsers)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Privacy levels
type PrivacyLevel = 'full' | 'summary' | 'pillars-only';

const PRIVACY_OPTIONS: Array<{
  id: PrivacyLevel;
  title: string;
  description: string;
  icon: typeof Eye;
}> = [
  {
    id: 'pillars-only',
    title: 'Pillars Only',
    description: 'Share only your strategic pillars and goals',
    icon: Shield,
  },
  {
    id: 'summary',
    title: 'Summary',
    description: 'Share one-page summary without conversation details',
    icon: Eye,
  },
  {
    id: 'full',
    title: 'Full Access',
    description: 'Share complete plan including all conversations',
    icon: Users,
  },
];

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('summary');
  const [expiresIn, setExpiresIn] = useState<'7d' | '30d' | 'never'>('30d');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const storage = getStorageAdapter();
        const loadedPlan = await storage.getPlan(planId);

        if (!loadedPlan) {
          router.push('/dashboard');
          return;
        }

        setPlan(loadedPlan);

        // Check for existing share token in localStorage
        const existingToken = localStorage.getItem(`share_${planId}`);
        if (existingToken) {
          try {
            const data = JSON.parse(existingToken);
            setShareToken(data.token);
            setPrivacyLevel(data.privacy);
            setExpiresIn(data.expires);
          } catch {
            // Invalid data, ignore
          }
        }
      } catch (err) {
        console.error('Failed to load plan:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPlan();
  }, [planId, router]);

  const generateShareLink = async () => {
    setIsGenerating(true);
    
    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = generateShareToken();
    setShareToken(token);
    
    // Store share settings
    const shareData = {
      token,
      privacy: privacyLevel,
      expires: expiresIn,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`share_${planId}`, JSON.stringify(shareData));
    
    setIsGenerating(false);
  };

  const regenerateLink = async () => {
    setShareToken(null);
    await generateShareLink();
  };

  const revokeLink = () => {
    localStorage.removeItem(`share_${planId}`);
    setShareToken(null);
  };

  const getShareUrl = () => {
    if (!shareToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/shared/${planId}/${shareToken}`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`My Strategic Plan: ${plan?.title}`);
    const body = encodeURIComponent(
      `I'd like to share my strategic plan with you.\n\nView it here: ${getShareUrl()}\n\nNote: This link ${expiresIn === 'never' ? 'does not expire' : `expires in ${expiresIn === '7d' ? '7 days' : '30 days'}`}.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="texture-subtle" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/plan/${planId}`}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Plan</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-stone-700">Aythya Strategy</span>
          </div>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-display text-display-md text-stone-800 mb-2">
            Share Your Plan
          </h1>
          <p className="text-stone-500">
            Create a shareable link for "{plan?.title}"
          </p>
        </div>

        {/* Privacy notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium text-sm">
                Privacy Notice
              </p>
              <p className="text-amber-700 text-sm mt-1">
                Your plan contains personal information. Only share with people
                you trust. You can revoke access at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Level Selection */}
        <div className="card-elevated mb-6">
          <h2 className="font-display text-lg text-stone-800 mb-4">
            What to Share
          </h2>
          <div className="space-y-3">
            {PRIVACY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    privacyLevel === option.id
                      ? 'border-sage-400 bg-sage-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={option.id}
                    checked={privacyLevel === option.id}
                    onChange={() => setPrivacyLevel(option.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      privacyLevel === option.id
                        ? 'bg-sage-500 text-white'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-800">{option.title}</p>
                    <p className="text-sm text-stone-500">{option.description}</p>
                  </div>
                  {privacyLevel === option.id && (
                    <Check className="w-5 h-5 text-sage-500 flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Expiration */}
        <div className="card-elevated mb-6">
          <h2 className="font-display text-lg text-stone-800 mb-4">
            Link Expiration
          </h2>
          <div className="flex gap-3">
            {(['7d', '30d', 'never'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setExpiresIn(option)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  expiresIn === option
                    ? 'border-sage-400 bg-sage-50 text-sage-700'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {option === '7d' && '7 Days'}
                {option === '30d' && '30 Days'}
                {option === 'never' && 'Never'}
              </button>
            ))}
          </div>
        </div>

        {/* Generate/Share Link */}
        {!shareToken ? (
          <button
            onClick={generateShareLink}
            disabled={isGenerating}
            className="btn-primary w-full justify-center"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Generate Share Link
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Share link display */}
            <div className="card-elevated">
              <label className="input-label">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="input-base flex-1 text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="btn-primary btn-sm flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-2">
                {expiresIn === 'never'
                  ? 'This link does not expire'
                  : `This link expires in ${expiresIn === '7d' ? '7 days' : '30 days'}`}
              </p>
            </div>

            {/* Share options */}
            <div className="flex gap-3">
              <button
                onClick={shareViaEmail}
                className="btn-ghost flex-1 justify-center"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: plan?.title,
                      text: 'Check out my strategic plan',
                      url: getShareUrl(),
                    });
                  }
                }}
                className="btn-ghost flex-1 justify-center"
              >
                <MessageCircle className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Management options */}
            <div className="flex gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={regenerateLink}
                className="btn-ghost text-sm flex-1 justify-center"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={revokeLink}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors justify-center flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Revoke Access
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-stone-100 rounded-xl">
          <p className="text-sm text-stone-600">
            <strong>Note:</strong> In this version, shared links work by storing
            share settings locally. For production use with real sharing
            functionality, you'd need to implement server-side storage and
            authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
