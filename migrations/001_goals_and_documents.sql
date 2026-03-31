-- ============================================
-- Aythya Strategy - Goals & Documents Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USER DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'disc', 'strengthsfinder', 'pi', 'custom')),
  custom_type_name TEXT, -- For custom documents like "360 Feedback", "Performance Review"
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extracted_text TEXT, -- AI-extracted summary for context
  consent_given BOOLEAN DEFAULT false NOT NULL,
  consent_timestamp TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '12 months') NOT NULL,
  expiry_warning_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Unique constraint: one of each type per user (except custom which uses custom_type_name)
  CONSTRAINT unique_document_per_user UNIQUE (user_id, document_type, custom_type_name)
);

-- Index for quick user lookups
CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX idx_user_documents_expires_at ON user_documents(expires_at);

-- ============================================
-- 2. USER VALUES TABLE (Top of hierarchy)
-- ============================================

CREATE TABLE IF NOT EXISTS user_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- For ordering (lower = higher priority)
  ai_suggested BOOLEAN DEFAULT false, -- Was this suggested by AI?
  user_confirmed BOOLEAN DEFAULT false, -- Has user explicitly confirmed?
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_values_user_id ON user_values(user_id);
CREATE INDEX idx_user_values_plan_id ON user_values(plan_id);

-- ============================================
-- 3. USER GOALS TABLE (Linked to values)
-- ============================================

CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  value_id UUID REFERENCES user_values(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Goal classification
  goal_type TEXT CHECK (goal_type IN ('standard', 'reach')) DEFAULT 'standard',
  -- Measurement
  measurement_type TEXT CHECK (measurement_type IN ('quantitative', 'qualitative')) DEFAULT 'qualitative',
  measurement_target TEXT, -- e.g., "Run 3x per week", "Complete certification", "Feel more confident in meetings"
  measurement_current TEXT, -- Current progress description
  measurement_value NUMERIC, -- For quantitative: current numeric value
  measurement_goal_value NUMERIC, -- For quantitative: target numeric value
  measurement_unit TEXT, -- e.g., "times per week", "hours", "dollars"
  -- Timing
  timeframe TEXT CHECK (timeframe IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')) DEFAULT 'quarterly',
  start_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  -- Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')) DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  -- Metadata
  ai_suggested BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  notes TEXT, -- User notes about this goal
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_value_id ON user_goals(value_id);
CREATE INDEX idx_user_goals_plan_id ON user_goals(plan_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
CREATE INDEX idx_user_goals_deadline ON user_goals(deadline);

-- ============================================
-- 4. USER TASKS TABLE (Linked to goals)
-- ============================================

CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  recurrence_days INTEGER[], -- For weekly: [1,3,5] = Mon, Wed, Fri
  recurrence_end_date DATE,
  -- Timing
  due_date DATE,
  due_time TIME,
  estimated_minutes INTEGER, -- Estimated time to complete
  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  -- Metadata
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_goal_id ON user_tasks(goal_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_due_date ON user_tasks(due_date);

-- ============================================
-- 5. EMAIL PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Digest settings
  digest_enabled BOOLEAN DEFAULT true,
  digest_frequency TEXT CHECK (digest_frequency IN ('daily', 'weekly', 'none')) DEFAULT 'weekly',
  digest_day INTEGER CHECK (digest_day >= 0 AND digest_day <= 6) DEFAULT 0, -- 0=Sunday
  digest_time TIME DEFAULT '09:00',
  -- Quarterly summary
  quarterly_summary_enabled BOOLEAN DEFAULT true,
  -- Deadline reminders
  deadline_reminders_enabled BOOLEAN DEFAULT true,
  deadline_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before deadline to remind
  -- Celebration emails (when goals completed)
  celebration_emails_enabled BOOLEAN DEFAULT true,
  -- Timezone
  timezone TEXT DEFAULT 'America/New_York',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);

-- ============================================
-- 6. GOAL REMINDERS TABLE (Per-goal overrides)
-- ============================================

CREATE TABLE IF NOT EXISTS goal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Override settings
  reminder_enabled BOOLEAN DEFAULT true,
  custom_days_before INTEGER[], -- Override default deadline days
  custom_reminder_times TIMESTAMPTZ[], -- Specific reminder times
  -- Tracking
  last_reminder_sent TIMESTAMPTZ,
  next_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(goal_id)
);

CREATE INDEX idx_goal_reminders_goal_id ON goal_reminders(goal_id);
CREATE INDEX idx_goal_reminders_next_reminder ON goal_reminders(next_reminder_at);

-- ============================================
-- 7. EMAIL LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('digest_daily', 'digest_weekly', 'deadline_reminder', 'quarterly_summary', 'expiry_warning', 'goal_completed', 'reassessment_reminder')),
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  -- References
  goal_ids UUID[], -- Which goals this email referenced
  task_ids UUID[], -- Which tasks this email referenced
  -- Status
  status TEXT CHECK (status IN ('sent', 'failed', 'bounced')) DEFAULT 'sent',
  error_message TEXT,
  -- Metadata
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_log_user_id ON email_log(user_id);
CREATE INDEX idx_email_log_sent_at ON email_log(sent_at);
CREATE INDEX idx_email_log_type ON email_log(email_type);

-- ============================================
-- 8. PLAN REASSESSMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS plan_reassessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  -- Scheduling
  recommended_date DATE NOT NULL,
  reason TEXT, -- AI-generated explanation of why this timing was recommended
  -- Status
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  -- If they did reassess, link to new plan
  new_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_plan_reassessments_user_id ON plan_reassessments(user_id);
CREATE INDEX idx_plan_reassessments_recommended_date ON plan_reassessments(recommended_date);

-- ============================================
-- 9. GOAL HISTORY TABLE (Track changes over time)
-- ============================================

CREATE TABLE IF NOT EXISTS goal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT CHECK (change_type IN ('created', 'status_change', 'progress_update', 'edited', 'deadline_changed')),
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_goal_history_goal_id ON goal_history(goal_id);
CREATE INDEX idx_goal_history_created_at ON goal_history(created_at);

-- ============================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_reassessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS POLICIES
-- ============================================

-- User documents
CREATE POLICY "Users can view own documents" ON user_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON user_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON user_documents
  FOR DELETE USING (auth.uid() = user_id);

-- User values
CREATE POLICY "Users can manage own values" ON user_values
  FOR ALL USING (auth.uid() = user_id);

-- User goals
CREATE POLICY "Users can manage own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

-- User tasks
CREATE POLICY "Users can manage own tasks" ON user_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Email preferences
CREATE POLICY "Users can manage own email preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Goal reminders
CREATE POLICY "Users can manage own goal reminders" ON goal_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Email log (read only for users)
CREATE POLICY "Users can view own email log" ON email_log
  FOR SELECT USING (auth.uid() = user_id);

-- Plan reassessments
CREATE POLICY "Users can manage own reassessments" ON plan_reassessments
  FOR ALL USING (auth.uid() = user_id);

-- Goal history (read only)
CREATE POLICY "Users can view own goal history" ON goal_history
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 12. STORAGE BUCKET FOR DOCUMENTS
-- ============================================

-- Create the storage bucket (run separately if needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];

-- Storage RLS policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 13. HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_values_updated_at
  BEFORE UPDATE ON user_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_reminders_updated_at
  BEFORE UPDATE ON goal_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_reassessments_updated_at
  BEFORE UPDATE ON plan_reassessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log goal changes
CREATE OR REPLACE FUNCTION log_goal_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO goal_history (goal_id, user_id, change_type, new_value)
    VALUES (NEW.id, NEW.user_id, 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO goal_history (goal_id, user_id, change_type, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'status_change', 
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
    -- Log progress updates
    IF OLD.progress_percentage != NEW.progress_percentage THEN
      INSERT INTO goal_history (goal_id, user_id, change_type, old_value, new_value)
      VALUES (NEW.id, NEW.user_id, 'progress_update',
        jsonb_build_object('progress', OLD.progress_percentage),
        jsonb_build_object('progress', NEW.progress_percentage));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_goal_changes_trigger
  AFTER INSERT OR UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION log_goal_changes();

-- ============================================
-- 14. DEFAULT EMAIL PREFERENCES (Create on user signup)
-- ============================================

-- This function creates default email preferences when a user signs up
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user creation (if not already exists)
DROP TRIGGER IF EXISTS on_auth_user_created_email_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_email_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_email_preferences();

-- ============================================
-- DONE! Run this migration in Supabase SQL Editor
-- ============================================
