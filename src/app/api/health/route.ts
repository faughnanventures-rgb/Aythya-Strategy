/**
 * Health Check API Route
 * 
 * Used for monitoring and deployment verification.
 * Returns minimal information in production to avoid reconnaissance.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, return minimal information
  if (isProduction) {
    return NextResponse.json({
      status: 'ok',
      timestamp: now,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
  
  // In development, return detailed information
  const health = {
    status: 'healthy',
    timestamp: now,
    environment: 'development',
    checks: {
      api: !!process.env.ANTHROPIC_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  };
  
  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
