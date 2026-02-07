/**
 * Next.js Middleware
 * 
 * Handles authentication checks and CSRF protection at the edge.
 * Runs before every request to protected routes.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// CONFIGURATION
// ============================================

// Routes that require authentication in production
const PROTECTED_API_ROUTES = ['/api/chat', '/api/plan'];

// CSRF-protected methods
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ============================================
// HELPERS
// ============================================

function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // ----------------------------------------
  // 1. CSRF Token Management
  // ----------------------------------------
  
  // Get or create CSRF token
  let csrfToken = request.cookies.get('csrf_token')?.value;
  
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: false, // Must be readable by JavaScript to send in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }
  
  // ----------------------------------------
  // 2. CSRF Validation for State-Changing Requests
  // ----------------------------------------
  
  if (CSRF_PROTECTED_METHODS.includes(request.method) && pathname.startsWith('/api/')) {
    const headerToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('csrf_token')?.value;
    
    // In development, allow requests without CSRF for easier testing
    const isDev = process.env.NODE_ENV === 'development';
    const skipCSRF = isDev && process.env.SKIP_CSRF_IN_DEV === 'true';
    
    if (!skipCSRF && (!headerToken || headerToken !== cookieToken)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'Invalid or missing CSRF token',
          },
        },
        { status: 403 }
      );
    }
  }
  
  // ----------------------------------------
  // 3. Session Management
  // ----------------------------------------
  
  // Get or create session ID for user tracking
  let sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${generateCSRFToken().substring(0, 16)}`;
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  
  // ----------------------------------------
  // 4. Authentication Check (Production)
  // ----------------------------------------
  
  const isProduction = process.env.NODE_ENV === 'production';
  const requireAuth = process.env.REQUIRE_AUTH === 'true';
  
  if (isProduction && requireAuth && isProtectedRoute(pathname)) {
    // Check for authenticated session
    // In Phase 2, this will integrate with NextAuth
    const authSession = request.cookies.get('auth_session')?.value;
    
    if (!authSession) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        );
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // ----------------------------------------
  // 5. Security Headers for API Routes
  // ----------------------------------------
  
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  
  // ----------------------------------------
  // 6. Add Request ID for Tracing
  // ----------------------------------------
  
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);
  
  return response;
}

// ============================================
// MATCHER CONFIGURATION
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
