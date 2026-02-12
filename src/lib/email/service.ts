/**
 * Email Service
 * 
 * Handles sending email reminders, digests, and notifications
 * using Resend (recommended) or other email providers.
 */

import { Resend } from 'resend';
import type { 
  UserGoal, 
  UserTask, 
  EmailPreferences, 
  EmailType 
} from '@/types/goals';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Aythya Strategy <noreply@aythya.io>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aythya.io';

// ============================================
// EMAIL TEMPLATES
// ============================================

interface DigestEmailData {
  userName: string;
  upcomingTasks: Array<UserTask & { goalTitle?: string }>;
  completedLastWeek: number;
  totalLastWeek: number;
  focusArea?: string;
  focusReason?: string;
}

function generateWeeklyDigestHtml(data: DigestEmailData): string {
  const { userName, upcomingTasks, completedLastWeek, totalLastWeek, focusArea, focusReason } = data;
  
  const taskListHtml = upcomingTasks
    .slice(0, 5)
    .map(task => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4;">
          <div style="font-weight: 500; color: #1c1917;">${task.title}</div>
          <div style="font-size: 12px; color: #78716c; margin-top: 4px;">
            ${task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No due date'}
            ${task.goalTitle ? ` • Goal: ${task.goalTitle}` : ''}
          </div>
        </td>
      </tr>
    `)
    .join('');

  const progressPercent = totalLastWeek > 0 
    ? Math.round((completedLastWeek / totalLastWeek) * 100) 
    : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Update - Aythya Strategy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4a7c59 0%, #6b8e5c 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                Your Weekly Update
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                Week of ${formatDate(new Date().toISOString())}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <p style="margin: 0; color: #44403c; font-size: 16px;">
                Hi ${userName},
              </p>
              <p style="margin: 12px 0 0 0; color: #78716c; font-size: 14px; line-height: 1.6;">
                Here's what's coming up this week and how you did last week.
              </p>
            </td>
          </tr>

          <!-- Progress Section -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Last Week's Progress
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #1c1917;">
                      ${completedLastWeek} of ${totalLastWeek} tasks
                    </div>
                    <div style="background-color: #e7e5e4; border-radius: 4px; height: 8px; margin-top: 12px; overflow: hidden;">
                      <div style="background-color: ${progressPercent >= 75 ? '#22c55e' : progressPercent >= 50 ? '#84cc16' : '#f59e0b'}; height: 100%; width: ${progressPercent}%; border-radius: 4px;"></div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Upcoming Tasks -->
          ${upcomingTasks.length > 0 ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="font-size: 16px; font-weight: 600; color: #1c1917; margin-bottom: 16px;">
                📅 This Week
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${taskListHtml}
              </table>
              ${upcomingTasks.length > 5 ? `
              <div style="margin-top: 12px; font-size: 13px; color: #78716c;">
                + ${upcomingTasks.length - 5} more tasks
              </div>
              ` : ''}
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">🎉</div>
                <div style="color: #166534; font-size: 14px;">
                  No tasks due this week. Enjoy the break!
                </div>
              </div>
            </td>
          </tr>
          `}

          <!-- Focus Area -->
          ${focusArea ? `
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
                <div style="font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 4px;">
                  💡 Suggested Focus: ${focusArea}
                </div>
                <div style="font-size: 13px; color: #78716c;">
                  ${focusReason}
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="${APP_URL}/dashboard" 
                 style="display: inline-block; background-color: #4a7c59; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
                View Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 32px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0 0 8px 0; color: #78716c; font-size: 12px;">
                Aythya Strategy - Your Personal Strategic Plan
              </p>
              <p style="margin: 0; color: #a8a29e; font-size: 11px;">
                <a href="${APP_URL}/settings/email" style="color: #78716c;">Email Preferences</a>
                &nbsp;•&nbsp;
                <a href="${APP_URL}/unsubscribe" style="color: #78716c;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generateDeadlineReminderHtml(task: UserTask, goalTitle?: string): string {
  const daysUntil = task.due_date 
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const urgencyColor = daysUntil <= 1 ? '#dc2626' : daysUntil <= 3 ? '#f59e0b' : '#4a7c59';
  const urgencyText = daysUntil === 0 ? 'Due today!' : daysUntil === 1 ? 'Due tomorrow!' : `Due in ${daysUntil} days`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <tr>
            <td style="padding: 32px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 16px;">⏰</div>
              <div style="color: ${urgencyColor}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                ${urgencyText}
              </div>
              <h2 style="margin: 0; color: #1c1917; font-size: 20px; font-weight: 600;">
                ${task.title}
              </h2>
              ${goalTitle ? `
              <div style="margin-top: 8px; color: #78716c; font-size: 14px;">
                Part of: ${goalTitle}
              </div>
              ` : ''}
              ${task.due_date ? `
              <div style="margin-top: 12px; color: #44403c; font-size: 14px;">
                📅 ${formatDate(task.due_date)}
              </div>
              ` : ''}
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 8px;">
                    <a href="${APP_URL}/dashboard?complete=${task.id}" 
                       style="display: block; background-color: #4a7c59; color: #ffffff; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; text-align: center;">
                      ✓ Mark Complete
                    </a>
                  </td>
                  <td style="padding-left: 8px;">
                    <a href="${APP_URL}/dashboard" 
                       style="display: block; background-color: #f5f5f4; color: #44403c; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; text-align: center;">
                      View Task
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafaf9; padding: 16px 32px; text-align: center; border-top: 1px solid #e7e5e4;">
              <p style="margin: 0; color: #a8a29e; font-size: 11px;">
                <a href="${APP_URL}/settings/email" style="color: #78716c;">Adjust reminder settings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  emailType: EmailType;
  userId: string;
  goalIds?: string[];
  taskIds?: string[];
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, emailType, userId, goalIds, taskIds } = options;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      await logEmail(userId, emailType, subject, to, 'failed', goalIds, taskIds, error.message);
      return false;
    }

    await logEmail(userId, emailType, subject, to, 'sent', goalIds, taskIds);
    return true;

  } catch (error) {
    console.error('Email service error:', error);
    await logEmail(userId, emailType, subject, to, 'failed', goalIds, taskIds, String(error));
    return false;
  }
}

export async function sendWeeklyDigest(
  userId: string,
  email: string,
  userName: string,
  preferences: EmailPreferences,
  tasks: Array<UserTask & { goalTitle?: string }>,
  completedLastWeek: number,
  totalLastWeek: number
): Promise<boolean> {
  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .filter(t => {
      if (!t.due_date) return true;
      const dueDate = new Date(t.due_date);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return dueDate <= weekFromNow;
    })
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  // Determine focus area (simple heuristic - goal with most overdue tasks)
  const overdueTasks = tasks.filter(t => 
    t.due_date && 
    new Date(t.due_date) < new Date() && 
    t.status !== 'completed'
  );

  let focusArea: string | undefined;
  let focusReason: string | undefined;

  if (overdueTasks.length > 0) {
    const goalCounts: Record<string, number> = {};
    overdueTasks.forEach(t => {
      if (t.goalTitle) {
        goalCounts[t.goalTitle] = (goalCounts[t.goalTitle] || 0) + 1;
      }
    });
    
    const topGoal = Object.entries(goalCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topGoal) {
      focusArea = topGoal[0];
      focusReason = `You have ${topGoal[1]} overdue task${topGoal[1] > 1 ? 's' : ''} here.`;
    }
  }

  const html = generateWeeklyDigestHtml({
    userName,
    upcomingTasks,
    completedLastWeek,
    totalLastWeek,
    focusArea,
    focusReason,
  });

  return sendEmail({
    to: email,
    subject: `Your Aythya Weekly Update - ${upcomingTasks.length} tasks this week`,
    html,
    emailType: 'digest_weekly',
    userId,
    taskIds: upcomingTasks.map(t => t.id),
  });
}

export async function sendDeadlineReminder(
  userId: string,
  email: string,
  task: UserTask,
  goalTitle?: string
): Promise<boolean> {
  const daysUntil = task.due_date 
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const subject = daysUntil === 0 
    ? `⏰ Due today: "${task.title}"`
    : daysUntil === 1
    ? `⏰ Due tomorrow: "${task.title}"`
    : `📅 Task due in ${daysUntil} days: "${task.title}"`;

  const html = generateDeadlineReminderHtml(task, goalTitle);

  return sendEmail({
    to: email,
    subject,
    html,
    emailType: 'deadline_reminder',
    userId,
    taskIds: [task.id],
    goalIds: task.goal_id ? [task.goal_id] : undefined,
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

async function logEmail(
  userId: string,
  emailType: EmailType,
  subject: string,
  recipientEmail: string,
  status: 'sent' | 'failed',
  goalIds?: string[],
  taskIds?: string[],
  errorMessage?: string
): Promise<void> {
  try {
    // Import supabase client dynamically to avoid circular deps
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('email_log').insert({
      user_id: userId,
      email_type: emailType,
      subject,
      recipient_email: recipientEmail,
      status,
      goal_ids: goalIds,
      task_ids: taskIds,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

// ============================================
// CRON JOB HANDLERS
// ============================================

export async function processWeeklyDigests(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Find users with weekly digest enabled on this day
  const { data: users } = await supabase
    .from('email_preferences')
    .select(`
      user_id,
      digest_day,
      timezone,
      users:user_id (
        email,
        raw_user_meta_data
      )
    `)
    .eq('digest_enabled', true)
    .eq('digest_frequency', 'weekly')
    .eq('digest_day', dayOfWeek);

  if (!users?.length) return;

  for (const userPref of users) {
    try {
      // Get user's tasks
      const { data: tasks } = await supabase
        .from('user_tasks')
        .select(`
          *,
          user_goals (title)
        `)
        .eq('user_id', userPref.user_id);

      // Get completion stats for last week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { count: completedCount } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userPref.user_id)
        .eq('status', 'completed')
        .gte('completed_at', weekAgo.toISOString());

      const { count: totalCount } = await supabase
        .from('user_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userPref.user_id)
        .gte('created_at', weekAgo.toISOString());

      const user = userPref.users as any;
      const userName = user?.raw_user_meta_data?.full_name || 
                       user?.raw_user_meta_data?.name || 
                       'there';

      const tasksWithGoals = (tasks || []).map(t => ({
        ...t,
        goalTitle: t.user_goals?.title,
      }));

      await sendWeeklyDigest(
        userPref.user_id,
        user?.email,
        userName,
        userPref as any,
        tasksWithGoals,
        completedCount || 0,
        totalCount || 0
      );

    } catch (error) {
      console.error(`Failed to send digest to user ${userPref.user_id}:`, error);
    }
  }
}

export async function processDeadlineReminders(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get users with deadline reminders enabled
  const { data: preferences } = await supabase
    .from('email_preferences')
    .select(`
      user_id,
      deadline_days_before,
      users:user_id (email)
    `)
    .eq('deadline_reminders_enabled', true);

  if (!preferences?.length) return;

  for (const pref of preferences) {
    try {
      const daysBeforeList = pref.deadline_days_before || [7, 3, 1];

      for (const daysBefore of daysBeforeList) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Find tasks due on this date that haven't been reminded today
        const { data: tasks } = await supabase
          .from('user_tasks')
          .select(`
            *,
            user_goals (title)
          `)
          .eq('user_id', pref.user_id)
          .eq('due_date', targetDateStr)
          .neq('status', 'completed');

        for (const task of tasks || []) {
          // Check if we already sent a reminder for this task today
          const { count } = await supabase
            .from('email_log')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', pref.user_id)
            .eq('email_type', 'deadline_reminder')
            .contains('task_ids', [task.id])
            .gte('sent_at', new Date().toISOString().split('T')[0]);

          if (count === 0) {
            const user = pref.users as any;
            await sendDeadlineReminder(
              pref.user_id,
              user?.email,
              task,
              task.user_goals?.title
            );
          }
        }
      }

    } catch (error) {
      console.error(`Failed to process reminders for user ${pref.user_id}:`, error);
    }
  }
}
