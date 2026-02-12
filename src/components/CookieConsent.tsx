'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'aythya_cookie_consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    document.cookie = `cookie_consent=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    setIsVisible(false);
  };

  const handleClose = () => {
    // Just close without accepting - they can still use the site
    // but we'll show the banner again next visit
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-soft-lg border border-stone-200 p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-sage-100 items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-sage-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-stone-800 mb-1">
                Privacy-First Cookies
              </h3>
              <p className="text-sm text-stone-600 mb-3">
                We use essential cookies only — no tracking, no ads. Your planning 
                data stays in your browser. By continuing to use this site, you 
                accept our{' '}
                <Link 
                  href="/cookies" 
                  className="text-sage-600 hover:text-sage-700 underline"
                >
                  cookie policy
                </Link>
                .
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAccept}
                  className="btn-primary btn-sm"
                >
                  Accept & Continue
                </button>
                <Link
                  href="/privacy"
                  className="btn-ghost btn-sm text-stone-600"
                >
                  Learn More
                </Link>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
