/**
 * API Client Utilities
 * 
 * Provides helper functions for making secure API requests
 * with CSRF protection and error handling.
 */

// ============================================
// CSRF TOKEN MANAGEMENT
// ============================================

/**
 * Get the CSRF token from cookies
 * The cookie is set with httpOnly: false so JavaScript can read it
 */
export function getCSRFToken(): string | null {
  // In development, we can skip CSRF if configured
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_CSRF === 'true') {
    return 'dev-csrf-token';
  }
  
  // Read directly from cookie
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match?.[1] ?? null;
  }
  
  return null;
}

// ============================================
// API REQUEST HELPERS
// ============================================

interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Make an API request with CSRF protection
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: APIRequestOptions = {}
): Promise<APIResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    }
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies
    });
    
    const data: APIResponse<T> = await response.json();
    
    // Handle specific error codes
    if (!response.ok) {
      if (response.status === 401) {
        // Session expired - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else if (response.status === 403) {
        // CSRF or permission error - log for debugging
        console.warn('Access forbidden - possible CSRF issue or permissions');
      } else if (response.status === 429) {
        // Rate limited - no action needed, error message will be shown
        console.warn('Rate limited');
      }
    }
    
    return data;
  } catch (error) {
    // Don't log in production to avoid console noise
    if (process.env.NODE_ENV !== 'production') {
      console.error('API request failed:', error);
    }
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please check your connection.',
      },
    };
  }
}

/**
 * Chat API request helper
 */
export async function sendChatMessage(
  planId: string,
  message: string,
  phase: string
): Promise<APIResponse<{
  message: string;
  suggestedNextPhase?: string;
  followUpQuestions?: string[];
  rateLimit: { remaining: number; resetIn: number };
}>> {
  return apiRequest('/api/chat', {
    method: 'POST',
    body: { planId, message, phase },
  });
}
