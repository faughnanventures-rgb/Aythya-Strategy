/**
 * Supabase Storage Adapter
 * 
 * Replaces localStorage with Supabase database.
 * All operations respect RLS policies for data security.
 * 
 * SECURITY:
 * - RLS ensures users can only access their own data
 * - All queries are parameterized (no SQL injection)
 * - Soft deletes preserve audit trail
 */

import { createClient } from './client';
import type { 
  Plan, 
  PlanInsert, 
  PlanUpdate, 
  PlanPhase,
  PlanningMode,
  ConversationMessage 
} from './types';
import type { 
  StrategicPlan, 
  ConversationMessage as AppConversationMessage,
  PlanPhase as AppPlanPhase 
} from '@/types';

// ============================================
// TYPE CONVERTERS
// ============================================

function dbPlanToAppPlan(dbPlan: Plan): StrategicPlan {
  return {
    id: dbPlan.id,
    userId: dbPlan.user_id,
    title: dbPlan.title,
    status: dbPlan.status,
    currentPhase: dbPlan.current_phase as AppPlanPhase,
    currentState: dbPlan.current_state as StrategicPlan['currentState'],
    energyAudit: dbPlan.energy_audit as StrategicPlan['energyAudit'],
    minimumViableStability: dbPlan.minimum_viable_stability as StrategicPlan['minimumViableStability'],
    strategicPillars: (dbPlan.strategic_pillars as StrategicPlan['strategicPillars']) || [],
    tacticalMap: dbPlan.tactical_map as StrategicPlan['tacticalMap'],
    goals: (dbPlan.goals as StrategicPlan['goals']) || [],
    relationshipAudit: dbPlan.relationship_audit as StrategicPlan['relationshipAudit'],
    reflection: dbPlan.reflection as StrategicPlan['reflection'],
    createdAt: new Date(dbPlan.created_at),
    updatedAt: new Date(dbPlan.updated_at),
    completedAt: dbPlan.completed_at ? new Date(dbPlan.completed_at) : null,
  };
}

function dbMessagesToAppMessages(messages: unknown): AppConversationMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((msg: ConversationMessage) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    metadata: msg.metadata,
  }));
}

function appMessagesToDbMessages(messages: AppConversationMessage[]): ConversationMessage[] {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : String(msg.timestamp),
    metadata: msg.metadata as ConversationMessage['metadata'],
  }));
}

// ============================================
// SUPABASE STORAGE ADAPTER
// ============================================

export const supabaseStorage = {
  /**
   * Create a new plan for the current user
   */
  async createPlan(
    userId: string, 
    title: string, 
    planningMode: PlanningMode = 'short'
  ): Promise<StrategicPlan> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        title: title || 'My Strategic Plan',
        planning_mode: planningMode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      throw new Error(`Failed to create plan: ${error.message}`);
    }

    return dbPlanToAppPlan(data);
  },

  /**
   * Get a plan by ID
   * RLS ensures only the owner can access it
   */
  async getPlan(planId: string): Promise<StrategicPlan | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found or not authorized
      }
      console.error('Error fetching plan:', error);
      throw new Error(`Failed to fetch plan: ${error.message}`);
    }

    return dbPlanToAppPlan(data);
  },

  /**
   * Update a plan
   */
  async updatePlan(planId: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const supabase = createClient();
    
    const dbUpdates: PlanUpdate = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.currentPhase !== undefined) dbUpdates.current_phase = updates.currentPhase as PlanPhase;
    if (updates.currentState !== undefined) dbUpdates.current_state = updates.currentState as PlanUpdate['current_state'];
    if (updates.energyAudit !== undefined) dbUpdates.energy_audit = updates.energyAudit as PlanUpdate['energy_audit'];
    if (updates.minimumViableStability !== undefined) dbUpdates.minimum_viable_stability = updates.minimumViableStability as PlanUpdate['minimum_viable_stability'];
    if (updates.strategicPillars !== undefined) dbUpdates.strategic_pillars = updates.strategicPillars as PlanUpdate['strategic_pillars'];
    if (updates.tacticalMap !== undefined) dbUpdates.tactical_map = updates.tacticalMap as PlanUpdate['tactical_map'];
    if (updates.goals !== undefined) dbUpdates.goals = updates.goals as PlanUpdate['goals'];
    if (updates.relationshipAudit !== undefined) dbUpdates.relationship_audit = updates.relationshipAudit as PlanUpdate['relationship_audit'];
    if (updates.reflection !== undefined) dbUpdates.reflection = updates.reflection as PlanUpdate['reflection'];
    if (updates.completedAt !== undefined) {
      dbUpdates.completed_at = updates.completedAt instanceof Date 
        ? updates.completedAt.toISOString() 
        : updates.completedAt;
    }

    const { data, error } = await supabase
      .from('plans')
      .update(dbUpdates)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan:', error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }

    return dbPlanToAppPlan(data);
  },

  /**
   * Soft delete a plan (preserves data for recovery)
   */
  async deletePlan(planId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('plans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      console.error('Error deleting plan:', error);
      throw new Error(`Failed to delete plan: ${error.message}`);
    }
  },

  /**
   * List all plans for a user
   */
  async listPlans(userId: string): Promise<StrategicPlan[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error listing plans:', error);
      throw new Error(`Failed to list plans: ${error.message}`);
    }

    return data.map(dbPlanToAppPlan);
  },

  /**
   * Get conversation for a plan/phase
   */
  async getConversation(planId: string, phase: string): Promise<AppConversationMessage[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('plan_id', planId)
      .eq('phase', phase)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return []; // No conversation yet
      }
      console.error('Error fetching conversation:', error);
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return dbMessagesToAppMessages(data.messages);
  },

  /**
   * Save conversation for a plan/phase
   */
  async saveConversation(
    planId: string, 
    phase: string, 
    messages: AppConversationMessage[]
  ): Promise<void> {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const dbMessages = appMessagesToDbMessages(messages);

    // Upsert - insert or update if exists
    const { error } = await supabase
      .from('conversations')
      .upsert(
        {
          plan_id: planId,
          phase: phase as PlanPhase,
          user_id: user.id,
          messages: dbMessages,
          message_count: messages.length,
        },
        {
          onConflict: 'plan_id,phase',
        }
      );

    if (error) {
      console.error('Error saving conversation:', error);
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
  },

  /**
   * Get message counts for all phases
   */
  async getMessageCounts(planId: string): Promise<Record<string, number>> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('conversations')
      .select('phase, message_count')
      .eq('plan_id', planId);

    if (error) {
      console.error('Error fetching message counts:', error);
      return {};
    }

    const counts: Record<string, number> = {};
    data.forEach(row => {
      counts[row.phase] = row.message_count;
    });
    return counts;
  },

  /**
   * Create a shareable link
   */
  async createShareLink(planId: string, token: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('shared_plans')
      .insert({
        plan_id: planId,
        share_token: token,
      });

    if (error) {
      console.error('Error creating share link:', error);
      throw new Error(`Failed to create share link: ${error.message}`);
    }
  },

  /**
   * Get plan by share token (public access)
   */
  async getPlanByShareToken(token: string): Promise<StrategicPlan | null> {
    const supabase = createClient();
    
    // Get the share link
    const { data: shareData, error: shareError } = await supabase
      .from('shared_plans')
      .select('plan_id, view_count')
      .eq('share_token', token)
      .single();

    if (shareError || !shareData) {
      return null;
    }

    // Increment view count
    await supabase
      .from('shared_plans')
      .update({ view_count: shareData.view_count + 1 })
      .eq('share_token', token);

    // Get the plan - Note: This needs a special policy for shared access
    // For MVP, we'll return null and handle shared plans differently
    return null;
  },
};

export default supabaseStorage;
