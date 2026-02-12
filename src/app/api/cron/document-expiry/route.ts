/**
 * Document Expiry Cron Job
 * 
 * Runs daily at midnight to:
 * 1. Send 30-day warning emails for expiring documents
 * 2. Delete documents that have expired
 * 
 * Vercel Cron: 0 0 * * *
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find documents expiring in ~30 days that haven't been warned
    const { data: expiringDocs, error: expiringError } = await supabase
      .from('user_documents')
      .select(`
        id,
        user_id,
        document_type,
        custom_type_name,
        file_name,
        expires_at,
        users:user_id (
          email,
          raw_user_meta_data
        )
      `)
      .eq('expiry_warning_sent', false)
      .lte('expires_at', thirtyDaysFromNow.toISOString())
      .gt('expires_at', now.toISOString());

    if (expiringError) {
      console.error('Error fetching expiring docs:', expiringError);
    }

    // Send warning emails
    let warningsSent = 0;
    for (const doc of expiringDocs || []) {
      try {
        const user = doc.users as any;
        if (!user?.email) continue;

        // Send warning email
        await sendExpiryWarningEmail(
          user.email,
          user.raw_user_meta_data?.full_name || 'there',
          doc.document_type,
          doc.custom_type_name,
          doc.file_name,
          doc.expires_at
        );

        // Mark as warned
        await supabase
          .from('user_documents')
          .update({ expiry_warning_sent: true })
          .eq('id', doc.id);

        warningsSent++;
      } catch (err) {
        console.error(`Failed to send warning for doc ${doc.id}:`, err);
      }
    }

    // Find and delete expired documents
    const { data: expiredDocs, error: expiredError } = await supabase
      .from('user_documents')
      .select('id, file_path')
      .lt('expires_at', now.toISOString());

    if (expiredError) {
      console.error('Error fetching expired docs:', expiredError);
    }

    let deleted = 0;
    for (const doc of expiredDocs || []) {
      try {
        // Delete from storage
        await supabase.storage
          .from('user-documents')
          .remove([doc.file_path]);

        // Delete from database
        await supabase
          .from('user_documents')
          .delete()
          .eq('id', doc.id);

        deleted++;
      } catch (err) {
        console.error(`Failed to delete doc ${doc.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true,
      warnings_sent: warningsSent,
      documents_deleted: deleted,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Document expiry cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}

async function sendExpiryWarningEmail(
  email: string,
  userName: string,
  documentType: string,
  customTypeName: string | null,
  fileName: string,
  expiresAt: string
) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const docLabel = documentType === 'custom' 
    ? customTypeName || 'Custom Document'
    : {
        resume: 'Resume',
        disc: 'DISC Assessment',
        strengthsfinder: 'StrengthsFinder Results',
        pi: 'Predictive Index',
      }[documentType] || documentType;

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Aythya Strategy <noreply@aythya.io>',
    to: email,
    subject: `Your ${docLabel} will expire in 30 days`,
    html: `
      <p>Hi ${userName},</p>
      
      <p>Your uploaded document <strong>${fileName}</strong> (${docLabel}) will be automatically deleted on <strong>${expiryDate}</strong> as part of our data retention policy.</p>
      
      <p>If you'd like to keep this document:</p>
      <ul>
        <li>Go to your Profile → Documents</li>
        <li>Click "Extend" on the document you want to keep</li>
        <li>This will add another 12 months</li>
      </ul>
      
      <p>If you're happy for it to be deleted, no action is needed.</p>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/documents" 
           style="display: inline-block; background-color: #4a7c59; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
          Manage Documents
        </a>
      </p>
      
      <p>Best,<br>Aythya Strategy</p>
    `,
  });
}
