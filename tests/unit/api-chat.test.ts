/**
 * Chat API Route Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@/lib/ai/claude', () => ({
  aiClient: {
    chat: vi.fn().mockResolvedValue({
      message: 'Test response from Claude',
      followUpQuestions: ['Question 1?'],
    }),
    checkRateLimit: vi.fn().mockReturnValue({
      allowed: true,
      remaining: 9,
      resetIn: 3600,
    }),
  },
}));

vi.mock('@/lib/storage/adapter', () => ({
  getStorageAdapter: vi.fn().mockReturnValue({
    getPlan: vi.fn().mockResolvedValue({
      id: 'test-plan-id',
      userId: 'dev-user-local',
      title: 'Test Plan',
      status: 'in_progress',
      currentPhase: 'current_state',
    }),
    getConversation: vi.fn().mockResolvedValue([]),
    saveConversation: vi.fn().mockResolvedValue(undefined),
    updatePlan: vi.fn().mockResolvedValue({}),
  }),
}));

import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { aiClient } from '@/lib/ai/claude';
import { getStorageAdapter } from '@/lib/storage/adapter';

function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('returns 400 for missing planId', async () => {
      const request = createMockRequest({
        message: 'Hello',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing message', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid phase', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello',
        phase: 'invalid_phase',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for empty message', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: '',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for message too long', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'a'.repeat(10001),
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('too long');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 when rate limit exceeded', async () => {
      vi.mocked(aiClient.checkRateLimit).mockReturnValueOnce({
        allowed: false,
        remaining: 0,
        resetIn: 3600,
      });

      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Plan Access', () => {
    it('returns 404 for non-existent plan', async () => {
      vi.mocked(getStorageAdapter().getPlan).mockResolvedValueOnce(null);

      const request = createMockRequest({
        planId: 'non-existent',
        message: 'Hello',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('PLAN_NOT_FOUND');
    });

    it('returns 403 for unauthorized access', async () => {
      vi.mocked(getStorageAdapter().getPlan).mockResolvedValueOnce({
        id: 'test-plan-id',
        userId: 'different-user',
        title: 'Test Plan',
        status: 'in_progress',
        currentPhase: 'current_state',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        currentState: null,
        energyAudit: null,
        minimumViableStability: null,
        strategicPillars: [],
        tacticalMap: null,
        goals: [],
        relationshipAudit: null,
        reflection: null,
      });

      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Successful Chat', () => {
    it('returns AI response for valid request', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello, I want to start planning',
        phase: 'current_state',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Test response from Claude');
      expect(data.data.followUpQuestions).toBeDefined();
    });

    it('saves conversation after successful chat', async () => {
      const storage = getStorageAdapter();

      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello',
        phase: 'current_state',
      });

      await POST(request);

      expect(storage.saveConversation).toHaveBeenCalled();
    });

    it('includes rate limit info in response', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello',
        phase: 'current_state',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.rateLimit).toBeDefined();
      expect(data.data.rateLimit.remaining).toBeDefined();
      expect(data.data.rateLimit.resetIn).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('sanitizes script tags from message', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Hello <script>alert("xss")</script> world',
        phase: 'current_state',
      });

      await POST(request);

      expect(aiClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringContaining('<script>'),
        })
      );
    });

    it('sanitizes javascript: URLs from message', async () => {
      const request = createMockRequest({
        planId: 'test-plan-id',
        message: 'Click javascript:alert(1)',
        phase: 'current_state',
      });

      await POST(request);

      expect(aiClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringContaining('javascript:'),
        })
      );
    });
  });
});

describe('Chat API Security', () => {
  it('does not expose internal errors', async () => {
    vi.mocked(aiClient.chat).mockRejectedValueOnce(
      new Error('Internal database error with sensitive info')
    );

    const request = createMockRequest({
      planId: 'test-plan-id',
      message: 'Hello',
      phase: 'current_state',
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(data.error.message).not.toContain('database');
    expect(data.error.message).not.toContain('sensitive');
  });
});
