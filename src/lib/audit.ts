/**
 * Audit Logging Service
 * 
 * Logs security-relevant events to Supabase for compliance and debugging.
 * 
 * Events logged:
 * - Authentication (login, logout, signup, password reset)
 * - Authorization (access denied, plan access)
 * - Data operations (create, update, delete)
 * - Security events (rate limit, CSRF failure)
 * 
 * COMPLIANCE:
 * - GDPR: Tracks data access
 * - SOC 2: Security event logging
 */

import { createClient } from '@/lib/supabase/client';

export type AuditAction = 
  // Auth events
  | 'auth.login'
  | 'auth.logout'
  | 'auth.signup'
  | 'auth.password_reset_request'
  | 'auth.password_reset_complete'
  | 'auth.login_failed'
  | 'auth.oauth_login'
  
  // Plan events
  | 'plan.create'
  | 'plan.view'
  | 'plan.update'
  | 'plan.delete'
  | 'plan.share'
  | 'plan.export'
  
  // Security events
  | 'security.rate_limit_exceeded'
  | 'security.csrf_failure'
  | 'security.unauthorized_access'
  | 'security.suspicious_activity'
  
  // Account events
  | 'account.data_export'
  | 'account.delete_request'
  | 'account.settings_change';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  resourceType?: 'plan' | 'conversation' | 'profile' | 'auth' | 'system';
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event (client-side)
 * 
 * Note: For sensitive operations, prefer server-side logging
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createClient();
    
    // Get current user if not provided
    let userId = entry.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }
    
    // Don't log if no user (except for auth failures)
    if (!userId && !entry.action.startsWith('auth.login_failed')) {
      return;
    }
    
    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        details: entry.details,
        ip_address: entry.ipAddress,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
    
    if (error) {
      // Don't throw - audit logging shouldn't break the app
      console.warn('Audit log failed:', error.message);
    }
  } catch {
    // Silent fail - audit logging is best-effort
    console.warn('Audit logging error');
  }
}

/**
 * Server-side audit logging
 * Use this in API routes for more reliable logging
 */
export async function logAuditEventServer(
  supabaseClient: ReturnType<typeof createClient>,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabaseClient.rpc('create_audit_log', {
      p_user_id: entry.userId || null,
      p_action: entry.action,
      p_resource_type: entry.resourceType || null,
      p_resource_id: entry.resourceId || null,
      p_details: entry.details || null,
    });
    
    if (error) {
      console.warn('Server audit log failed:', error.message);
    }
  } catch {
    console.warn('Server audit logging error');
  }
}

/**
 * Helper to create audit context from request
 */
export function getAuditContext(request: Request): Partial<AuditLogEntry> {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
  };
}

export default { logAuditEvent, logAuditEventServer, getAuditContext };
