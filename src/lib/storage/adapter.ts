/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for data persistence that can switch between:
 * - localStorage (for development/testing)
 * - Supabase (for production)
 * 
 * Switch modes via NEXT_PUBLIC_STORAGE_MODE env variable
 */

import type {
  StorageAdapter,
  StorageMode,
  StrategicPlan,
  PlanPhase,
  ConversationMessage,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

export function getStorageMode(): StorageMode {
  if (typeof window === 'undefined') {
    // Server-side: check env
    return (process.env.NEXT_PUBLIC_STORAGE_MODE as StorageMode) || 'local';
  }
  // Client-side: check env
  return (process.env.NEXT_PUBLIC_STORAGE_MODE as StorageMode) || 'local';
}

// ============================================
// LOCAL STORAGE ADAPTER
// ============================================

const LOCAL_STORAGE_KEYS = {
  PLANS: 'aythya_plans',
  CONVERSATIONS: 'aythya_conversations',
  USER: 'aythya_user',
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function safeJSONParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function getFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  return safeJSONParse(localStorage.getItem(key), fallback);
}

function setToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

const localStorageAdapter: StorageAdapter = {
  async createPlan(userId: string, title: string): Promise<StrategicPlan> {
    const plans = getFromLocalStorage<StrategicPlan[]>(LOCAL_STORAGE_KEYS.PLANS, []);
    
    const newPlan: StrategicPlan = {
      id: generateId(),
      userId,
      title,
      status: 'draft',
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
    };
    
    plans.push(newPlan);
    setToLocalStorage(LOCAL_STORAGE_KEYS.PLANS, plans);
    
    return newPlan;
  },

  async getPlan(planId: string): Promise<StrategicPlan | null> {
    const plans = getFromLocalStorage<StrategicPlan[]>(LOCAL_STORAGE_KEYS.PLANS, []);
    return plans.find((p) => p.id === planId) ?? null;
  },

  async updatePlan(planId: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const plans = getFromLocalStorage<StrategicPlan[]>(LOCAL_STORAGE_KEYS.PLANS, []);
    const index = plans.findIndex((p) => p.id === planId);
    
    if (index === -1) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const existingPlan = plans[index];
    if (!existingPlan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const updatedPlan: StrategicPlan = {
      ...existingPlan,
      ...updates,
      updatedAt: new Date(),
    };
    
    plans[index] = updatedPlan;
    setToLocalStorage(LOCAL_STORAGE_KEYS.PLANS, plans);
    
    return updatedPlan;
  },

  async deletePlan(planId: string): Promise<void> {
    const plans = getFromLocalStorage<StrategicPlan[]>(LOCAL_STORAGE_KEYS.PLANS, []);
    const filtered = plans.filter((p) => p.id !== planId);
    setToLocalStorage(LOCAL_STORAGE_KEYS.PLANS, filtered);
    
    // Also delete associated conversations
    const conversations = getFromLocalStorage<Record<string, ConversationMessage[]>>(
      LOCAL_STORAGE_KEYS.CONVERSATIONS,
      {}
    );
    
    // Remove all conversations for this plan
    const keysToRemove = Object.keys(conversations).filter((key) =>
      key.startsWith(`${planId}:`)
    );
    keysToRemove.forEach((key) => {
      delete conversations[key];
    });
    
    setToLocalStorage(LOCAL_STORAGE_KEYS.CONVERSATIONS, conversations);
  },

  async listPlans(userId: string): Promise<StrategicPlan[]> {
    const plans = getFromLocalStorage<StrategicPlan[]>(LOCAL_STORAGE_KEYS.PLANS, []);
    return plans.filter((p) => p.userId === userId);
  },

  async savePhaseData<T>(planId: string, phase: PlanPhase, data: T): Promise<void> {
    const phaseToField: Record<PlanPhase, keyof StrategicPlan | null> = {
      current_state: 'currentState',
      energy_audit: 'energyAudit',
      minimum_viable_stability: 'minimumViableStability',
      strategic_pillars: 'strategicPillars',
      tactical_mapping: 'tacticalMap',
      goal_setting: 'goals',
      relationship_audit: 'relationshipAudit',
      reflection: 'reflection',
      completed: null,
    };
    
    const field = phaseToField[phase];
    if (!field) return;
    
    await this.updatePlan(planId, { [field]: data } as Partial<StrategicPlan>);
  },

  async getPhaseData<T>(planId: string, phase: PlanPhase): Promise<T | null> {
    const plan = await this.getPlan(planId);
    if (!plan) return null;
    
    const phaseToField: Record<PlanPhase, keyof StrategicPlan | null> = {
      current_state: 'currentState',
      energy_audit: 'energyAudit',
      minimum_viable_stability: 'minimumViableStability',
      strategic_pillars: 'strategicPillars',
      tactical_mapping: 'tacticalMap',
      goal_setting: 'goals',
      relationship_audit: 'relationshipAudit',
      reflection: 'reflection',
      completed: null,
    };
    
    const field = phaseToField[phase];
    if (!field) return null;
    
    return plan[field] as T | null;
  },

  async saveConversation(
    planId: string,
    phase: PlanPhase,
    messages: ConversationMessage[]
  ): Promise<void> {
    const conversations = getFromLocalStorage<Record<string, ConversationMessage[]>>(
      LOCAL_STORAGE_KEYS.CONVERSATIONS,
      {}
    );
    
    const key = `${planId}:${phase}`;
    conversations[key] = messages;
    
    setToLocalStorage(LOCAL_STORAGE_KEYS.CONVERSATIONS, conversations);
  },

  async getConversation(planId: string, phase: PlanPhase): Promise<ConversationMessage[]> {
    const conversations = getFromLocalStorage<Record<string, ConversationMessage[]>>(
      LOCAL_STORAGE_KEYS.CONVERSATIONS,
      {}
    );
    
    const key = `${planId}:${phase}`;
    return conversations[key] ?? [];
  },
};

// ============================================
// SUPABASE ADAPTER (Production)
// ============================================

import { supabaseStorage } from '@/lib/supabase/storage';

const supabaseAdapter: StorageAdapter = {
  async createPlan(userId: string, title: string): Promise<StrategicPlan> {
    return supabaseStorage.createPlan(userId, title);
  },
  async getPlan(planId: string): Promise<StrategicPlan | null> {
    return supabaseStorage.getPlan(planId);
  },
  async updatePlan(planId: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan> {
    return supabaseStorage.updatePlan(planId, updates);
  },
  async deletePlan(planId: string): Promise<void> {
    return supabaseStorage.deletePlan(planId);
  },
  async listPlans(userId: string): Promise<StrategicPlan[]> {
    return supabaseStorage.listPlans(userId);
  },
  async savePhaseData<T>(planId: string, phase: PlanPhase, data: T): Promise<void> {
    const phaseToField: Record<PlanPhase, keyof StrategicPlan | null> = {
      current_state: 'currentState',
      energy_audit: 'energyAudit',
      minimum_viable_stability: 'minimumViableStability',
      strategic_pillars: 'strategicPillars',
      tactical_mapping: 'tacticalMap',
      goal_setting: 'goals',
      relationship_audit: 'relationshipAudit',
      reflection: 'reflection',
      completed: null,
    };
    
    const field = phaseToField[phase];
    if (!field) return;
    
    await this.updatePlan(planId, { [field]: data } as Partial<StrategicPlan>);
  },
  async getPhaseData<T>(planId: string, phase: PlanPhase): Promise<T | null> {
    const plan = await this.getPlan(planId);
    if (!plan) return null;
    
    const phaseToField: Record<PlanPhase, keyof StrategicPlan | null> = {
      current_state: 'currentState',
      energy_audit: 'energyAudit',
      minimum_viable_stability: 'minimumViableStability',
      strategic_pillars: 'strategicPillars',
      tactical_mapping: 'tacticalMap',
      goal_setting: 'goals',
      relationship_audit: 'relationshipAudit',
      reflection: 'reflection',
      completed: null,
    };
    
    const field = phaseToField[phase];
    if (!field) return null;
    
    return plan[field] as T | null;
  },
  async saveConversation(
    planId: string,
    phase: PlanPhase,
    messages: ConversationMessage[]
  ): Promise<void> {
    return supabaseStorage.saveConversation(planId, phase, messages);
  },
  async getConversation(planId: string, phase: PlanPhase): Promise<ConversationMessage[]> {
    return supabaseStorage.getConversation(planId, phase);
  },
};

// ============================================
// ADAPTER FACTORY
// ============================================

let cachedAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (cachedAdapter) return cachedAdapter;
  
  const mode = getStorageMode();
  
  switch (mode) {
    case 'local':
      cachedAdapter = localStorageAdapter;
      break;
    case 'supabase':
      cachedAdapter = supabaseAdapter;
      break;
    default:
      console.warn(`Unknown storage mode: ${mode}, falling back to local`);
      cachedAdapter = localStorageAdapter;
  }
  
  return cachedAdapter;
}

// Reset cached adapter (useful for testing)
export function resetStorageAdapter(): void {
  cachedAdapter = null;
}

// ============================================
// CONVENIENCE HOOKS EXPORTS
// ============================================

export const storage = {
  get adapter() {
    return getStorageAdapter();
  },
  get mode() {
    return getStorageMode();
  },
};

export default storage;
