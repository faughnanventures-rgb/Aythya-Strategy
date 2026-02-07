/**
 * Chat API Route
 * 
 * Handles conversation with Claude AI for strategic planning.
 * Includes authentication, rate limiting, CSRF validation, and input validation.
 * 
 * SECURITY:
 * - CSRF validation handled by middleware
 * - Session-based user identification
 * - Plan ownership verification
 * - Input sanitization and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiClient } from '@/lib/ai/claude';
import { getStorageAdapter } from '@/lib/storage/adapter';
import type { ConversationMessage } from '@/types';

// ============================================
// REQUEST VALIDATION
// ============================================

const ChatRequestSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required').max(100, 'Plan ID too long'),
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
});

// ============================================
// SECURITY HELPERS
// ============================================

function sanitizeInput(input: string): string {
  // Remove potential XSS vectors while preserving legitimate content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, 'data-blocked:')
    .trim();
}

/**
 * Get authenticated user ID from request
 * 
 * TODO: When adding real authentication, this should:
 * 1. Validate the session cookie
 * 2. Look up the actual user ID from the session
 * 
 * For now, returns a hardcoded dev user to match plan creation.
 */
function getAuthenticatedUserId(_request: NextRequest): string {
  // For development/MVP: always return the same user ID
  // This matches what's used in onboarding when creating plans
  return 'dev-user-local';
}

/**
 * Verify user owns the plan
 * 
 * Security: Prevents unauthorized access to other users' plans
 */
async function verifyPlanOwnership(
  planId: string,
  userId: string
): Promise<{ authorized: boolean; plan: Awaited<ReturnType<typeof getStorageAdapter>>['getPlan'] extends (id: string) => Promise<infer T> ? T : never }> {
  const storage = getStorageAdapter();
  const plan = await storage.getPlan(planId);
  
  if (!plan) {
    return { authorized: false, plan: null };
  }
  
  // Check ownership
  if (plan.userId !== userId) {
    // Log potential unauthorized access attempt
    console.warn(`[SECURITY] Unauthorized plan access attempt: user=${userId} plan=${planId} owner=${plan.userId}`);
    return { authorized: false, plan: null };
  }
  
  return { authorized: true, plan };
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
    // 1. Get user ID (currently hardcoded for dev)
    const userId = getAuthenticatedUserId(request);
    
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
    
    const { planId, message, phase } = validationResult.data;
    
    // 3. Verify plan ownership (CRITICAL SECURITY CHECK)
    const { authorized, plan } = await verifyPlanOwnership(planId, userId);
    
    if (!authorized || !plan) {
      return createErrorResponse(
        'Plan not found or access denied',
        404,
        'NOT_FOUND',
        requestId
      );
    }
    
    // 4. Check rate limit
    const rateLimit = aiClient.checkRateLimit(userId);
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
    
    // 6. Get conversation history for this phase
    const storage = getStorageAdapter();
    const conversationHistory = await storage.getConversation(planId, phase);
    
    // 7. Call Claude AI
    const response = await aiClient.chat({
      userId,
      planId,
      message: sanitizedMessage,
      phase,
      conversationHistory,
      planContext: plan,
    });
    
    // 8. Save updated conversation history
    const newUserMessage: ConversationMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: sanitizedMessage,
      timestamp: new Date(),
      metadata: { phase },
    };
    
    const newAssistantMessage: ConversationMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: {
        phase,
        extractedData: response.extractedData,
        followUpQuestions: response.followUpQuestions,
      },
    };
    
    const updatedHistory = [
      ...conversationHistory,
      newUserMessage,
      newAssistantMessage,
    ];
    
    // Limit conversation history length to prevent memory issues
    const maxLength = parseInt(process.env.MAX_CONVERSATION_LENGTH || '100', 10);
    const trimmedHistory = updatedHistory.slice(-maxLength);
    
    await storage.saveConversation(planId, phase, trimmedHistory);
    
    // 9. Update plan phase if suggested
    if (response.suggestedNextPhase && response.suggestedNextPhase !== plan.currentPhase) {
      await storage.updatePlan(planId, {
        currentPhase: response.suggestedNextPhase,
        status: response.suggestedNextPhase === 'completed' ? 'completed' : 'in_progress',
      });
    }
    
    // 10. Return response
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
        // Don't reveal API key issues to users
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
    
    // Generic error - don't leak internal details
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
