/**
 * Supabase Database Types
 * 
 * These types match our database schema and provide type safety
 * for all Supabase operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanPhase = 
  | 'current_state'
  | 'energy_audit'
  | 'minimum_viable_stability'
  | 'strategic_pillars'
  | 'tactical_mapping'
  | 'goal_setting'
  | 'relationship_audit'
  | 'reflection'
  | 'completed';

export type PlanStatus = 'draft' | 'in_progress' | 'completed';
export type PlanningMode = 'short' | 'long';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: PlanStatus;
          current_phase: PlanPhase;
          planning_mode: PlanningMode;
          current_state: Json | null;
          energy_audit: Json | null;
          minimum_viable_stability: Json | null;
          strategic_pillars: Json;
          tactical_map: Json | null;
          goals: Json;
          relationship_audit: Json | null;
          reflection: Json | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          status?: PlanStatus;
          current_phase?: PlanPhase;
          planning_mode?: PlanningMode;
          current_state?: Json | null;
          energy_audit?: Json | null;
          minimum_viable_stability?: Json | null;
          strategic_pillars?: Json;
          tactical_map?: Json | null;
          goals?: Json;
          relationship_audit?: Json | null;
          reflection?: Json | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          status?: PlanStatus;
          current_phase?: PlanPhase;
          planning_mode?: PlanningMode;
          current_state?: Json | null;
          energy_audit?: Json | null;
          minimum_viable_stability?: Json | null;
          strategic_pillars?: Json;
          tactical_map?: Json | null;
          goals?: Json;
          relationship_audit?: Json | null;
          reflection?: Json | null;
          updated_at?: string;
          completed_at?: string | null;
          deleted_at?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          phase: PlanPhase;
          messages: Json;
          message_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          phase: PlanPhase;
          messages?: Json;
          message_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          phase?: PlanPhase;
          messages?: Json;
          message_count?: number;
          updated_at?: string;
        };
      };
      shared_plans: {
        Row: {
          id: string;
          plan_id: string;
          share_token: string;
          expires_at: string | null;
          created_at: string;
          view_count: number;
        };
        Insert: {
          id?: string;
          plan_id: string;
          share_token: string;
          expires_at?: string | null;
          created_at?: string;
          view_count?: number;
        };
        Update: {
          id?: string;
          plan_id?: string;
          share_token?: string;
          expires_at?: string | null;
          view_count?: number;
        };
      };
    };
  };
}

// Convenience type aliases
export type Plan = Database['public']['Tables']['plans']['Row'];
export type PlanInsert = Database['public']['Tables']['plans']['Insert'];
export type PlanUpdate = Database['public']['Tables']['plans']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SharedPlan = Database['public']['Tables']['shared_plans']['Row'];

// Message type stored in conversations.messages JSONB
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    phase?: PlanPhase;
    extractedData?: Record<string, unknown>;
    followUpQuestions?: string[];
  };
}
