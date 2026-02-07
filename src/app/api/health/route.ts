/**
 * Health Check API Route
 * 
 * Used for monitoring and deployment verification.
 */

import { NextResponse } from 'next/server';
import { getStorageMode } from '@/lib/storage/adapter';

export async function GET() {
  const now = new Date().toISOString();
  
  // Basic health checks
  const health = {
    status: 'healthy',
    timestamp: now,
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    storageMode: getStorageMode(),
    checks: {
      api: true,
      storage: true,
    },
  };
  
  // Check if Claude API is configured (don't expose the actual key)
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
  if (!hasClaudeKey) {
    health.checks.api = false;
    health.status = 'degraded';
  }
  
  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
