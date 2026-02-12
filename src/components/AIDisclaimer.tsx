'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check } from 'lucide-react';

interface AIDisclaimerProps {
  onAccept: () => void;
  variant?: 'modal' | 'inline';
}

export function AIDisclaimer({ onAccept, variant = 'inline' }: AIDisclaimerProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-soft-xl max-w-lg w-full p-6 animate-scale-in">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-xl text-stone-800 mb-1">
                Important: AI Limitations
              </h2>
              <p className="text-stone-500 text-sm">
                Please read before continuing
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-stone-600 mb-6">
            <p>
              Aythya Strategy uses artificial intelligence to facilitate your 
              planning conversations. While helpful for reflection and organization, 
              please understand:
            </p>
            
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  <strong>Not professional advice:</strong> AI responses are not 
                  substitutes for financial advisors, lawyers, therapists, or 
                  medical professionals.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  <strong>Your decisions:</strong> You are responsible for any 
                  decisions made based on planning conversations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  <strong>AI limitations:</strong> The AI may make mistakes, 
                  misunderstand context, or provide incomplete information.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  <strong>Seek help:</strong> For mental health concerns, please 
                  contact a qualified professional or crisis line.
                </span>
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                isChecked
                  ? 'bg-sage-500 border-sage-500'
                  : 'border-stone-300 group-hover:border-sage-400'
              }`}
            >
              {isChecked && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-stone-700">
              I understand that this is an AI tool for reflection, not professional 
              advice, and I accept the{' '}
              <Link 
                href="/terms" 
                className="text-sage-600 hover:text-sage-700 underline"
                target="_blank"
              >
                Terms of Service
              </Link>
              .
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!isChecked}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800 mb-2">
            AI Planning Assistant Disclaimer
          </h3>
          <p className="text-amber-700 text-sm mb-3">
            This tool uses AI to facilitate strategic thinking. It is{' '}
            <strong>not a substitute</strong> for professional financial, legal, 
            medical, or mental health advice. Always consult qualified professionals 
            for important decisions.
          </p>
          <p className="text-amber-600 text-xs">
            By continuing, you accept our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIDisclaimer;
