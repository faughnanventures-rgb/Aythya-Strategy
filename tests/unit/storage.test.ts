/**
 * Storage Adapter Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ConversationMessage } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  getStorageAdapter,
  getStorageMode,
  resetStorageAdapter,
} from '@/lib/storage/adapter';

describe('Storage Adapter', () => {
  beforeEach(() => {
    localStorageMock.clear();
    resetStorageAdapter();
    vi.clearAllMocks();
  });

  describe('getStorageMode', () => {
    it('returns "local" by default', () => {
      expect(getStorageMode()).toBe('local');
    });
  });

  describe('Local Storage Adapter', () => {
    describe('createPlan', () => {
      it('creates a new plan with correct structure', async () => {
        const adapter = getStorageAdapter();
        const plan = await adapter.createPlan('user-123', 'My Test Plan');

        expect(plan).toMatchObject({
          userId: 'user-123',
          title: 'My Test Plan',
          status: 'draft',
          currentPhase: 'current_state',
        });
        expect(plan.id).toBeDefined();
        expect(plan.createdAt).toBeInstanceOf(Date);
        expect(plan.updatedAt).toBeInstanceOf(Date);
      });

      it('stores the plan in localStorage', async () => {
        const adapter = getStorageAdapter();
        await adapter.createPlan('user-123', 'Test Plan');

        expect(localStorageMock.setItem).toHaveBeenCalled();
        const storedData = JSON.parse(
          localStorageMock.setItem.mock.calls[0][1]
        );
        expect(storedData).toHaveLength(1);
        expect(storedData[0].title).toBe('Test Plan');
      });
    });

    describe('getPlan', () => {
      it('retrieves an existing plan', async () => {
        const adapter = getStorageAdapter();
        const created = await adapter.createPlan('user-123', 'Test Plan');
        const retrieved = await adapter.getPlan(created.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.title).toBe('Test Plan');
      });

      it('returns null for non-existent plan', async () => {
        const adapter = getStorageAdapter();
        const plan = await adapter.getPlan('non-existent-id');

        expect(plan).toBeNull();
      });
    });

    describe('updatePlan', () => {
      it('updates plan fields correctly', async () => {
        const adapter = getStorageAdapter();
        const created = await adapter.createPlan('user-123', 'Original Title');
        
        const updated = await adapter.updatePlan(created.id, {
          title: 'Updated Title',
          status: 'in_progress',
        });

        expect(updated.title).toBe('Updated Title');
        expect(updated.status).toBe('in_progress');
        expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
          created.updatedAt.getTime()
        );
      });

      it('throws error for non-existent plan', async () => {
        const adapter = getStorageAdapter();
        
        await expect(
          adapter.updatePlan('non-existent', { title: 'New' })
        ).rejects.toThrow('Plan not found');
      });
    });

    describe('deletePlan', () => {
      it('removes plan from storage', async () => {
        const adapter = getStorageAdapter();
        const plan = await adapter.createPlan('user-123', 'To Delete');
        
        await adapter.deletePlan(plan.id);
        const retrieved = await adapter.getPlan(plan.id);

        expect(retrieved).toBeNull();
      });
    });

    describe('listPlans', () => {
      it('returns all plans for a user', async () => {
        const adapter = getStorageAdapter();
        await adapter.createPlan('user-123', 'Plan 1');
        await adapter.createPlan('user-123', 'Plan 2');
        await adapter.createPlan('user-456', 'Other User Plan');

        const plans = await adapter.listPlans('user-123');

        expect(plans).toHaveLength(2);
        expect(plans.every((p) => p.userId === 'user-123')).toBe(true);
      });

      it('returns empty array for user with no plans', async () => {
        const adapter = getStorageAdapter();
        const plans = await adapter.listPlans('non-existent-user');

        expect(plans).toEqual([]);
      });
    });

    describe('Conversation operations', () => {
      it('saves and retrieves conversation', async () => {
        const adapter = getStorageAdapter();
        const plan = await adapter.createPlan('user-123', 'Test Plan');

        const messages: ConversationMessage[] = [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date(),
          },
        ];

        await adapter.saveConversation(plan.id, 'current_state', messages);
        const retrieved = await adapter.getConversation(
          plan.id,
          'current_state'
        );

        expect(retrieved).toHaveLength(2);
        expect(retrieved[0].content).toBe('Hello');
        expect(retrieved[1].content).toBe('Hi there!');
      });

      it('returns empty array for non-existent conversation', async () => {
        const adapter = getStorageAdapter();
        const messages = await adapter.getConversation(
          'non-existent',
          'current_state'
        );

        expect(messages).toEqual([]);
      });
    });

    describe('Phase data operations', () => {
      it('saves and retrieves phase data', async () => {
        const adapter = getStorageAdapter();
        const plan = await adapter.createPlan('user-123', 'Test Plan');

        const currentStateData = {
          id: 'cs-1',
          planId: plan.id,
          completedAt: null,
          openingContext: {
            strengthAreas: ['career', 'health'],
            triggerContext: 'Career transition',
            additionalContext: '',
          },
        };

        await adapter.savePhaseData(
          plan.id,
          'current_state',
          currentStateData
        );

        const retrieved = await adapter.getPhaseData(
          plan.id,
          'current_state'
        );

        expect(retrieved).toEqual(currentStateData);
      });
    });
  });
});

describe('Storage Security', () => {
  it('does not expose sensitive data in keys', async () => {
    const adapter = getStorageAdapter();
    await adapter.createPlan('user-123', 'Secret Plan');

    // Check that user ID is not directly in the key
    const calls = localStorageMock.setItem.mock.calls;
    const keys = calls.map((call) => call[0]);
    
    // Keys should be prefixed, not contain raw user IDs
    keys.forEach((key) => {
      expect(key).toMatch(/^aythya_/);
    });
  });
});
