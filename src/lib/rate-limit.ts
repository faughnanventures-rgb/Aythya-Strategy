/**
 * Production Rate Limiter
 * 
 * Uses Supabase for distributed rate limiting across serverless instances.
 * Falls back to in-memory for development.
 * 
 * SECURITY:
 * - Prevents API abuse
 * - Protects against cost explosion from Claude API
 * - Works across all Vercel serverless instances
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

// ============================================
// CONFIGURATION
// ============================================

const RATE_LIMIT_CONFIG = {
  requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '20', 10),
  requestsPerDay: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_DAY || '100', 10),
  windowMs: 3600000, // 1 hour in milliseconds
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  limit: number;
}

// ============================================
// IN-MEMORY FALLBACK (Development Only)
// ============================================

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function checkMemoryRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const key = `rate:${userId}`;
  
  let entry = memoryStore.get(key);
  
  // Reset if expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }
  
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.requestsPerHour - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);
  
  if (entry.count >= RATE_LIMIT_CONFIG.requestsPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      limit: RATE_LIMIT_CONFIG.requestsPerHour,
    };
  }
  
  // Increment
  entry.count += 1;
  memoryStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: remaining - 1,
    resetIn,
    limit: RATE_LIMIT_CONFIG.requestsPerHour,
  };
}

// ============================================
// SUPABASE-BASED RATE LIMITER (Production)
// ============================================

/**
 * Check and update rate limit using Supabase
 * Uses a simple approach: store count and window start in a table
 */
export async function checkRateLimitSupabase(userId: string): Promise<RateLimitResult> {
  // In development, use memory store for simplicity
  if (process.env.NODE_ENV === 'development' && process.env.USE_MEMORY_RATE_LIMIT === 'true') {
    return checkMemoryRateLimit(userId);
  }
  
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMs);
    
    // Count requests in the current window
    // We use the conversations table as a proxy - each message is a request
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('updated_at', windowStart.toISOString());
    
    if (error) {
      // On error, allow the request but log it
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        remaining: RATE_LIMIT_CONFIG.requestsPerHour,
        resetIn: 3600,
        limit: RATE_LIMIT_CONFIG.requestsPerHour,
      };
    }
    
    const currentCount = count || 0;
    const remaining = Math.max(0, RATE_LIMIT_CONFIG.requestsPerHour - currentCount);
    
    // Calculate reset time (next hour boundary)
    const resetAt = new Date(now);
    resetAt.setMinutes(0, 0, 0);
    resetAt.setHours(resetAt.getHours() + 1);
    const resetIn = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
    
    if (currentCount >= RATE_LIMIT_CONFIG.requestsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        limit: RATE_LIMIT_CONFIG.requestsPerHour,
      };
    }
    
    return {
      allowed: true,
      remaining,
      resetIn,
      limit: RATE_LIMIT_CONFIG.requestsPerHour,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open but with warning
    return {
      allowed: true,
      remaining: 1,
      resetIn: 3600,
      limit: RATE_LIMIT_CONFIG.requestsPerHour,
    };
  }
}

// ============================================
// SIMPLE TOKEN BUCKET (Alternative)
// ============================================

/**
 * Alternative: Use a dedicated rate_limits table
 * This is more accurate but requires a table migration
 * 
 * CREATE TABLE IF NOT EXISTS public.rate_limits (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   window_start TIMESTAMPTZ NOT NULL,
 *   request_count INTEGER NOT NULL DEFAULT 0,
 *   UNIQUE(user_id, window_start)
 * );
 */

export async function checkRateLimitWithTable(userId: string): Promise<RateLimitResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    
    // Get current hour window
    const windowStart = new Date(now);
    windowStart.setMinutes(0, 0, 0);
    
    // Try to get existing entry
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('window_start', windowStart.toISOString())
      .single();
    
    const currentCount = existing?.request_count || 0;
    
    if (currentCount >= RATE_LIMIT_CONFIG.requestsPerHour) {
      const resetAt = new Date(windowStart);
      resetAt.setHours(resetAt.getHours() + 1);
      
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        limit: RATE_LIMIT_CONFIG.requestsPerHour,
      };
    }
    
    // Increment counter (upsert)
    await supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        window_start: windowStart.toISOString(),
        request_count: currentCount + 1,
      }, {
        onConflict: 'user_id,window_start',
      });
    
    const resetAt = new Date(windowStart);
    resetAt.setHours(resetAt.getHours() + 1);
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.requestsPerHour - currentCount - 1,
      resetIn: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      limit: RATE_LIMIT_CONFIG.requestsPerHour,
    };
  } catch (error) {
    console.error('Rate limit with table error:', error);
    return checkMemoryRateLimit(userId);
  }
}

// ============================================
// EXPORTS
// ============================================

// Default export uses the conversation-based approach
// which doesn't require schema changes
export const checkRateLimit = checkRateLimitSupabase;

// Export memory version for testing
export { checkMemoryRateLimit };
