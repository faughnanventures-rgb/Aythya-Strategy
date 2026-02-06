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
 * Note: The cookie is httpOnly, so we need to make a request to get it
 * For now, we'll use a meta tag approach or request endpoint
 */
export async function getCSRFToken(): Promise<string | null> {
  // In development, we can skip CSRF if configured
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SKIP_CSRF === 'true') {
    return 'dev-csrf-token';
  }
  
  try {
    // Try to get from meta tag first (set by layout)
    if (typeof document !== 'undefined') {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        return metaTag.getAttribute('content');
      }
    }
    
    // Fallback: request from API endpoint
    const response = await fetch('/api/csrf', { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
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
    const csrfToken = await getCSRFToken();
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
        // Session expired - could trigger re-auth here
        console.warn('Session expired or unauthorized');
      } else if (response.status === 403) {
        // CSRF or permission error
        console.error('Access forbidden - possible CSRF issue');
      } else if (response.status === 429) {
        // Rate limited
        console.warn('Rate limited');
      }
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
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
