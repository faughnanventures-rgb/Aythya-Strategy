/**
 * Deadline Reminders Cron Job
 * 
 * Runs daily at 8am to send deadline reminder emails
 * for tasks due in the next 1, 3, 7, or 14 days.
 * 
 * Vercel Cron: 0 8 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDeadlineReminders } from '@/lib/email/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Running deadline reminders cron job');

    await processDeadlineReminders();

    return NextResponse.json({ 
      success: true, 
      message: 'Deadline reminders processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deadline reminders cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
