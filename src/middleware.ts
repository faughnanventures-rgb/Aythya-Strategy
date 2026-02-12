/**
 * Next.js Middleware
 * 
 * Handles:
 * - Supabase session refresh (critical for auth)
 * - CSRF protection for API routes
 * - Protected route access control
 * - Security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ============================================
// CONFIGURATION
// ============================================

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/plan', '/onboarding', '/settings'];
const PROTECTED_API_ROUTES = ['/api/chat', '/api/plan'];

// Auth routes (redirect to dashboard if already logged in)
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password'];

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
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ----------------------------------------
  // 1. Update Supabase Session
  // ----------------------------------------
  
  const { supabaseResponse, user } = await updateSession(request);
  
  // ----------------------------------------
  // 2. CSRF Token Management
  // ----------------------------------------
  
  let csrfToken = request.cookies.get('csrf_token')?.value;
  
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    supabaseResponse.cookies.set('csrf_token', csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }
  
  // ----------------------------------------
  // 3. CSRF Validation for API Requests
  // ----------------------------------------
  
  if (CSRF_PROTECTED_METHODS.includes(request.method) && pathname.startsWith('/api/')) {
    const headerToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('csrf_token')?.value;
    
    // Skip CSRF in development if configured
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
  // 4. Protected Route Access Control
  // ----------------------------------------
  
  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Redirect unauthenticated users to login for protected routes
  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Return 401 for protected API routes without auth
  if (!user && isProtectedApiRoute(pathname)) {
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
  
  // ----------------------------------------
  // 5. Security Headers for API Routes
  // ----------------------------------------
  
  if (pathname.startsWith('/api/')) {
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
    supabaseResponse.headers.set('X-Frame-Options', 'DENY');
    supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  
  // ----------------------------------------
  // 6. Request ID for Tracing
  // ----------------------------------------
  
  const requestId = crypto.randomUUID();
  supabaseResponse.headers.set('X-Request-ID', requestId);
  
  return supabaseResponse;
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
