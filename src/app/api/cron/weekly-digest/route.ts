/**
 * Weekly Digest Cron Job
 * 
 * Sends weekly digest emails to users on their preferred day.
 * Should be called daily - it checks if today matches the user's digest_day.
 * 
 * Deploy as a Vercel Cron Job:
 * vercel.json: { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processWeeklyDigests } from '@/lib/email/service';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing request in development');
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting weekly digest processing...');
    
    await processWeeklyDigests();
    
    console.log('Weekly digest processing complete');
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
