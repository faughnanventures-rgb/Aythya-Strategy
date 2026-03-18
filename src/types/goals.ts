/**
 * Aythya Strategy - Goals & Documents Types
 * 
 * Type definitions for the goals tracking, document upload,
 * and email reminder features.
 */

// ============================================
// DOCUMENT TYPES
// ============================================

export type DocumentType = 'resume' | 'disc' | 'strengthsfinder' | 'pi' | 'custom';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  custom_type_name?: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  extracted_text?: string | null;
  consent_given: boolean;
  consent_timestamp?: string | null;
  uploaded_at: string;
  expires_at: string;
  expiry_warning_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadRequest {
  document_type: DocumentType;
  custom_type_name?: string;
  file: File;
  consent_given: boolean;
}

export interface DocumentContext {
  resume?: string;
  disc?: string;
  strengthsfinder?: string;
  pi?: string;
  custom?: Record<string, string>;
}

// ============================================
// VALUE TYPES
// ============================================

export interface UserValue {
  id: string;
  user_id: string;
  plan_id?: string | null;
  title: string;
  description?: string | null;
  priority: number;
  ai_suggested: boolean;
  user_confirmed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  goals?: UserGoal[];
  progress_percentage?: number;
}

export interface CreateValueRequest {
  title: string;
  description?: string;
  plan_id?: string;
  priority?: number;
  ai_suggested?: boolean;
}

// ============================================
// GOAL TYPES
// ============================================

export type GoalType = 'standard' | 'reach';
export type MeasurementType = 'quantitative' | 'qualitative';
export type GoalTimeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';

export interface UserGoal {
  id: string;
  user_id: string;
  plan_id?: string | null;
  value_id?: string | null;
  title: string;
  description?: string | null;
  goal_type: GoalType;
  measurement_type: MeasurementType;
  measurement_target?: string | null;
  measurement_current?: string | null;
  measurement_value?: number | null;
  measurement_goal_value?: number | null;
  measurement_unit?: string | null;
  timeframe: GoalTimeframe;
  start_date: string;
  deadline?: string | null;
  status: GoalStatus;
  progress_percentage: number;
  ai_suggested: boolean;
  user_confirmed: boolean;
  priority: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  // Computed/joined fields
  value?: UserValue;
  tasks?: UserTask[];
  reminders?: GoalReminder;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  value_id?: string;
  plan_id?: string;
  goal_type?: GoalType;
  measurement_type?: MeasurementType;
  measurement_target?: string;
  measurement_goal_value?: number;
  measurement_unit?: string;
  timeframe?: GoalTimeframe;
  deadline?: string;
  priority?: number;
  ai_suggested?: boolean;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  value_id?: string;
  goal_type?: GoalType;
  measurement_type?: MeasurementType;
  measurement_target?: string;
  measurement_current?: string;
  measurement_value?: number;
  measurement_goal_value?: number;
  measurement_unit?: string;
  timeframe?: GoalTimeframe;
  deadline?: string;
  status?: GoalStatus;
  progress_percentage?: number;
  priority?: number;
  notes?: string;
  user_confirmed?: boolean;
}

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface UserTask {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description?: string | null;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  estimated_minutes?: number | null;
  status: TaskStatus;
  completed_at?: string | null;
  priority: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  goal?: UserGoal;
}

export interface CreateTaskRequest {
  goal_id: string;
  title: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_days?: number[];
  recurrence_end_date?: string;
  due_date?: string;
  due_time?: string;
  estimated_minutes?: number;
  priority?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_pattern?: RecurrencePattern;
  recurrence_days?: number[];
  recurrence_end_date?: string;
  due_date?: string;
  due_time?: string;
  estimated_minutes?: number;
  status?: TaskStatus;
  priority?: number;
  notes?: string;
}

// ============================================
// EMAIL PREFERENCE TYPES
// ============================================

export type DigestFrequency = 'daily' | 'weekly' | 'none';

export interface EmailPreferences {
  id: string;
  user_id: string;
  digest_enabled: boolean;
  digest_frequency: DigestFrequency;
  digest_day: number; // 0-6 (Sunday-Saturday)
  digest_time: string; // HH:MM format
  quarterly_summary_enabled: boolean;
  deadline_reminders_enabled: boolean;
  deadline_days_before: number[];
  celebration_emails_enabled: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateEmailPreferencesRequest {
  digest_enabled?: boolean;
  digest_frequency?: DigestFrequency;
  digest_day?: number;
  digest_time?: string;
  quarterly_summary_enabled?: boolean;
  deadline_reminders_enabled?: boolean;
  deadline_days_before?: number[];
  celebration_emails_enabled?: boolean;
  timezone?: string;
}

// ============================================
// GOAL REMINDER TYPES
// ============================================

export interface GoalReminder {
  id: string;
  goal_id: string;
  user_id: string;
  reminder_enabled: boolean;
  custom_days_before?: number[] | null;
  custom_reminder_times?: string[] | null;
  last_reminder_sent?: string | null;
  next_reminder_at?: string | null;
  reminder_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateGoalReminderRequest {
  reminder_enabled?: boolean;
  custom_days_before?: number[];
  custom_reminder_times?: string[];
}

// ============================================
// PLAN REASSESSMENT TYPES
// ============================================

export interface PlanReassessment {
  id: string;
  user_id: string;
  plan_id: string;
  recommended_date: string;
  reason?: string | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  completed: boolean;
  completed_at?: string | null;
  new_plan_id?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// GOAL HISTORY TYPES
// ============================================

export type GoalChangeType = 'created' | 'status_change' | 'progress_update' | 'edited' | 'deadline_changed';

export interface GoalHistory {
  id: string;
  goal_id: string;
  user_id: string;
  change_type: GoalChangeType;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
}

// ============================================
// EMAIL LOG TYPES
// ============================================

export type EmailType = 
  | 'digest_daily' 
  | 'digest_weekly' 
  | 'deadline_reminder' 
  | 'quarterly_summary' 
  | 'expiry_warning' 
  | 'goal_completed' 
  | 'reassessment_reminder';

export interface EmailLog {
  id: string;
  user_id: string;
  email_type: EmailType;
  subject: string;
  recipient_email: string;
  goal_ids?: string[] | null;
  task_ids?: string[] | null;
  status: 'sent' | 'failed' | 'bounced';
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
  sent_at: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export type DashboardView = 'kanban' | 'calendar' | 'list';

export interface DashboardFilters {
  status?: GoalStatus[];
  timeframe?: GoalTimeframe[];
  value_id?: string;
  search?: string;
  show_completed?: boolean;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: UserTask[];
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'goal_deadline' | 'reassessment';
  status: TaskStatus | GoalStatus;
  goal_id?: string;
  task_id?: string;
  color: string;
}

export interface DashboardStats {
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines: number;
  streak_days: number; // Days in a row with completed tasks
}

// ============================================
// AI GOAL EXTRACTION TYPES
// ============================================

export interface ExtractedGoalSuggestion {
  type: 'value' | 'goal' | 'task';
  title: string;
  description?: string;
  parent_title?: string; // For goals: value title. For tasks: goal title
  measurement_suggestion?: string;
  timeframe_suggestion?: GoalTimeframe;
  is_reach_goal?: boolean;
  confidence: number; // 0-1, how confident AI is this should be a goal
  source_phase?: string; // Which conversation phase this came from
  source_quote?: string; // Direct quote from user
}

export interface GoalExtractionResult {
  values: ExtractedGoalSuggestion[];
  goals: ExtractedGoalSuggestion[];
  tasks: ExtractedGoalSuggestion[];
  reassessment_recommendation: {
    months: number;
    reason: string;
  };
}

// ============================================
// PRINT/SHARE TYPES
// ============================================

export interface PrintableGoalList {
  generated_at: string;
  user_name?: string;
  plan_title?: string;
  values: Array<{
    title: string;
    description?: string;
    goals: Array<{
      title: string;
      description?: string;
      deadline?: string;
      measurement?: string;
      status: GoalStatus;
      tasks: Array<{
        title: string;
        due_date?: string;
        status: TaskStatus;
      }>;
    }>;
  }>;
}

export interface ShareableLink {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  view_type: 'goals_only' | 'full_plan';
  created_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface GoalsApiResponse {
  values: UserValue[];
  goals: UserGoal[];
  tasks: UserTask[];
  stats: DashboardStats;
}

export interface DocumentsApiResponse {
  documents: UserDocument[];
  context: DocumentContext;
}
