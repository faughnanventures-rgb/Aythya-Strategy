/**
 * Chat API Route
 * 
 * Handles conversation with Claude AI for strategic planning.
 * 
 * SECURITY:
 * - Supabase authentication (user must be logged in)
 * - CSRF validation handled by middleware
 * - Plan ownership verification via RLS
 * - Input sanitization and validation
 * - Rate limiting per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiClient, checkRateLimitAsync } from '@/lib/ai/claude';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ============================================
// REQUEST VALIDATION
// ============================================

const ChatRequestSchema = z.object({
  planId: z.string().uuid('Invalid plan ID format'),
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  phase: z.enum([
    'current_state',
    'energy_audit',
    'minimum_viable_stability',
    'strategic_pillars',
    'tactical_mapping',
    'goal_setting',
    'relationship_audit',
    'reflection',
    'completed',
  ] as const),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(50000, 'Message content too long'), // Max 50KB per message
  })).max(100, 'Conversation history too long').optional().default([]), // Max 100 messages
});

// ============================================
// SECURITY HELPERS
// ============================================

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, 'data-blocked:')
    .trim();
}

// ============================================
// RESPONSE HELPERS
// ============================================

function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  requestId?: string
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: code || 'ERROR',
        message,
      },
    },
    { status }
  );
  
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }
  
  return response;
}

function createSuccessResponse<T>(data: T, requestId?: string): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
  });
  
  if (requestId) {
    response.headers.set('X-Request-ID', requestId);
  }
  
  return response;
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  
  try {
    // 1. Authenticate user via Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse(
        'Authentication required',
        401,
        'UNAUTHORIZED',
        requestId
      );
    }
    
    const userId = user.id;
    
    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400, 'INVALID_JSON', requestId);
    }
    
    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors
        .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return createErrorResponse(errorMessage, 400, 'VALIDATION_ERROR', requestId);
    }
    
    const { planId, message, phase, conversationHistory } = validationResult.data;
    
    // 3. Verify plan ownership via Supabase (RLS handles this)
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, user_id, title, current_phase')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      return createErrorResponse(
        'Plan not found or access denied',
        404,
        'NOT_FOUND',
        requestId
      );
    }
    
    // Double-check ownership (RLS should handle this, but defense in depth)
    if (plan.user_id !== userId) {
      console.warn(`[SECURITY] Plan ownership mismatch: user=${userId} plan_owner=${plan.user_id}`);
      return createErrorResponse(
        'Plan not found or access denied',
        404,
        'NOT_FOUND',
        requestId
      );
    }
    
    // 4. Check rate limit (production-ready distributed rate limiting)
    const rateLimit = await checkRateLimitAsync(userId);
    if (!rateLimit.allowed) {
      return createErrorResponse(
        `Rate limit exceeded. Please wait ${rateLimit.resetIn} seconds before sending another message.`,
        429,
        'RATE_LIMIT_EXCEEDED',
        requestId
      );
    }
    
    // 5. Sanitize input
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return createErrorResponse('Message cannot be empty after sanitization', 400, 'EMPTY_MESSAGE', requestId);
    }
    
    // 6. Format conversation history for Claude
    const formattedHistory = conversationHistory.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
      id: '',
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }));
    
    // 7. Call Claude AI
    const response = await aiClient.chat({
      userId,
      planId,
      message: sanitizedMessage,
      phase,
      conversationHistory: formattedHistory,
      planContext: plan,
    });
    
    // 8. Return response
    return createSuccessResponse(
      {
        message: response.message,
        suggestedNextPhase: response.suggestedNextPhase,
        followUpQuestions: response.followUpQuestions,
        rateLimit: {
          remaining: rateLimit.remaining - 1,
          resetIn: rateLimit.resetIn,
        },
      },
      requestId
    );
    
  } catch (error) {
    console.error(`[${requestId}] Chat API error:`, error);
    
    // Handle known error types without leaking details
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return createErrorResponse(
          'Too many requests. Please wait a moment.',
          429,
          'RATE_LIMIT',
          requestId
        );
      }
      if (error.message.includes('API key')) {
        return createErrorResponse(
          'Service temporarily unavailable',
          503,
          'SERVICE_UNAVAILABLE',
          requestId
        );
      }
      if (error.message.includes('Claude API')) {
        return createErrorResponse(
          'AI service temporarily unavailable. Please try again.',
          503,
          'AI_UNAVAILABLE',
          requestId
        );
      }
    }
    
    return createErrorResponse(
      'An unexpected error occurred. Please try again.',
      500,
      'INTERNAL_ERROR',
      requestId
    );
  }
}

// ============================================
// OPTIONS (CORS Preflight)
// ============================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      'Access-Control-Max-Age': '86400',
    },
  });
}
