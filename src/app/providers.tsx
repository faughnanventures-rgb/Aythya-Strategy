'use client';

/**
 * Client-side Providers
 * 
 * Wraps the app with client-side context providers.
 * This is separated from the root layout because providers need 'use client'.
 */

import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}
