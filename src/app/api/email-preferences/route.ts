/**
 * Email Preferences API Route
 * 
 * GET - Fetch user's email preferences
 * PATCH - Update preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        user_id: user.id,
        digest_enabled: true,
        digest_frequency: 'weekly',
        digest_day: 0, // Sunday
        digest_time: '09:00',
        quarterly_summary_enabled: true,
        deadline_reminders_enabled: true,
        deadline_days_before: [7, 3, 1],
        celebration_emails_enabled: true,
        timezone: 'America/New_York',
      });
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Get email preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Validate allowed fields
    const allowedFields = [
      'digest_enabled',
      'digest_frequency',
      'digest_day',
      'digest_time',
      'quarterly_summary_enabled',
      'deadline_reminders_enabled',
      'deadline_days_before',
      'celebration_emails_enabled',
      'timezone',
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Validate specific fields
    if (filteredUpdates.digest_frequency && 
        !['daily', 'weekly', 'none'].includes(filteredUpdates.digest_frequency as string)) {
      return NextResponse.json({ error: 'Invalid digest_frequency' }, { status: 400 });
    }

    if (filteredUpdates.digest_day !== undefined && 
        ((filteredUpdates.digest_day as number) < 0 || (filteredUpdates.digest_day as number) > 6)) {
      return NextResponse.json({ error: 'Invalid digest_day' }, { status: 400 });
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: user.id,
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Update email preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
