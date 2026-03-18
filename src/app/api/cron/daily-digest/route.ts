/**
 * Daily Digest Cron Job
 * 
 * Runs daily at 9am to send daily digest emails to users
 * who have opted in.
 * 
 * Vercel Cron: 0 9 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWeeklyDigests } from '@/lib/email/service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 second timeout for cron jobs

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    const dayOfWeek = today.getDay();

    console.log(`Running digest cron job for day ${dayOfWeek}`);

    // Process weekly digests (checks if today is the user's digest day)
    await processWeeklyDigests();

    return NextResponse.json({ 
      success: true, 
      message: 'Digest processing complete',
      day: dayOfWeek,
      timestamp: today.toISOString()
    });

  } catch (error) {
    console.error('Digest cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
