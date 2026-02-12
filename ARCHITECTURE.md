# Aythya Strategy - Feature Architecture
## Document Uploads, Goals Tracking, Dashboard & Email Reminders

**Version:** 1.0
**Date:** February 2026
**Architects:** Sr. Engineer + Sr. Security Engineer

---

## 🏗️ Feature Overview

### 1. Document Uploads (Profile Enrichment)
- Resume, DISC, StrengthsFinder, PI, custom assessments
- Asked during onboarding, editable anytime
- Claude uses as background context

### 2. Goals & Values Tracking
- Hierarchy: Values → Goals → Tasks (1:many)
- AI-suggested from plan conversations, user confirms
- SMART-like goals with measurability + reach goals
- Custom timeframes (weekly, monthly, quarterly, yearly, specific dates)

### 3. Dashboard
- Default: Kanban view (To Do / In Progress / Done)
- Alternative: Calendar view
- Printable list view (for coaches/therapists)
- Mobile-responsive (50/50 mobile/desktop)

### 4. Email Reminders
- Per-goal custom reminders
- Weekly/daily digest options
- Quarterly summaries (auto, opt-out available)
- Deadline approaching alerts

---

## 🔐 Security Architecture

### Data Classification

| Data Type | Classification | Encryption | Retention |
|-----------|---------------|------------|-----------|
| Resume | PII - High | At rest + transit | 12 months (renewable) |
| Assessments | Personal - Medium | At rest + transit | 12 months (renewable) |
| Goals/Values | Personal - Low | At rest + transit | Indefinite |
| Conversation | Personal - Medium | At rest + transit | Indefinite |

### Security Controls

1. **Document Upload Security**
   - File type validation (PDF, DOCX, PNG, JPG only)
   - Max file size: 10MB
   - Virus scanning via ClamAV (if enabled)
   - Stored in Supabase Storage with RLS
   - User warning: "Do not include SSN, full address, or phone numbers"

2. **PII Consent**
   - Explicit consent checkbox before document upload
   - Consent text: "I understand my documents will be processed by AI to personalize my strategic plan"
   - Consent logged with timestamp

3. **Data Retention**
   - Auto-delete after 12 months
   - 30-day warning email before deletion
   - User can extend retention with one click

4. **Row Level Security (RLS)**
   - All tables protected by user_id
   - Documents only accessible by owner
   - Goals shared only if explicitly shared (coach view)

---

## 📊 Database Schema

### New Tables

```sql
-- User profile documents
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'disc', 'strengthsfinder', 'pi', 'custom')),
  custom_type_name TEXT, -- For custom documents
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extracted_text TEXT, -- AI-extracted summary
  consent_given BOOLEAN DEFAULT false NOT NULL,
  consent_timestamp TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '12 months') NOT NULL,
  expiry_warning_sent BOOLEAN DEFAULT false,
  UNIQUE(user_id, document_type, custom_type_name)
);

-- User values (top level of hierarchy)
CREATE TABLE user_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- For ordering
  ai_suggested BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Goals (linked to values)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  value_id UUID REFERENCES user_values(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('standard', 'reach')) DEFAULT 'standard',
  measurement_type TEXT CHECK (measurement_type IN ('quantitative', 'qualitative')) DEFAULT 'qualitative',
  measurement_target TEXT, -- e.g., "Run 3x per week" or "Feel more confident"
  measurement_current TEXT, -- Current progress
  timeframe TEXT CHECK (timeframe IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  deadline DATE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')) DEFAULT 'not_started',
  ai_suggested BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Tasks (linked to goals)
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_custom TEXT, -- JSON for custom patterns
  due_date DATE,
  due_time TIME,
  status TEXT CHECK (status IN ('pending', 'completed', 'skipped')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Email reminder preferences
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  digest_frequency TEXT CHECK (digest_frequency IN ('daily', 'weekly', 'none')) DEFAULT 'weekly',
  digest_day INTEGER CHECK (digest_day >= 0 AND digest_day <= 6), -- 0=Sunday
  digest_time TIME DEFAULT '09:00',
  quarterly_summary BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  deadline_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Remind 7, 3, 1 days before
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Per-goal reminder overrides
CREATE TABLE goal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES user_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_enabled BOOLEAN DEFAULT true,
  custom_schedule TEXT, -- JSON for custom reminder schedule
  last_reminder_sent TIMESTAMPTZ,
  next_reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Email log (for tracking sent emails)
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL, -- 'digest', 'deadline', 'quarterly', 'expiry_warning'
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  goal_ids UUID[], -- Which goals this email referenced
  metadata JSONB
);

-- Plan reassessment schedule
CREATE TABLE plan_reassessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  recommended_date DATE NOT NULL,
  reason TEXT, -- AI-generated reason for the timing
  reminder_sent BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### RLS Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_reassessments ENABLE ROW LEVEL SECURITY;

-- User documents - only owner can access
CREATE POLICY "Users can manage own documents" ON user_documents
  FOR ALL USING (auth.uid() = user_id);

-- User values - owner access
CREATE POLICY "Users can manage own values" ON user_values
  FOR ALL USING (auth.uid() = user_id);

-- User goals - owner access
CREATE POLICY "Users can manage own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

-- User tasks - owner access  
CREATE POLICY "Users can manage own tasks" ON user_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Email preferences - owner access
CREATE POLICY "Users can manage own email preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Goal reminders - owner access
CREATE POLICY "Users can manage own goal reminders" ON goal_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Email log - owner can view only
CREATE POLICY "Users can view own email log" ON email_log
  FOR SELECT USING (auth.uid() = user_id);

-- Plan reassessments - owner access
CREATE POLICY "Users can manage own reassessments" ON plan_reassessments
  FOR ALL USING (auth.uid() = user_id);
```

### Storage Bucket

```sql
-- Create storage bucket for user documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false);

-- RLS for storage
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔄 Data Flow

### Document Upload Flow
```
User → Upload Form → Validation → 
  → Show PII Warning → Require Consent →
  → Upload to Supabase Storage →
  → Extract text (if PDF/DOCX) →
  → Save metadata to user_documents →
  → Update user profile context for Claude
```

### Goals Extraction Flow
```
Plan Completion → AI analyzes conversations →
  → Generates suggested Values/Goals/Tasks →
  → User reviews in Goal Setting phase →
  → User confirms/edits/removes →
  → Save confirmed items to database →
  → Calculate reassessment date based on goal load
```

### Email Reminder Flow
```
Cron Job (daily) →
  → Check email_preferences for each user →
  → Check goal deadlines approaching →
  → Build digest if scheduled →
  → Send via Resend/SendGrid →
  → Log to email_log
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── calendar/page.tsx     # Calendar view
│   │   └── print/page.tsx        # Printable view
│   ├── profile/
│   │   ├── page.tsx              # Profile overview
│   │   └── documents/page.tsx    # Document management
│   └── plan/[id]/
│       └── goals/page.tsx        # Goals confirmation phase
├── components/
│   ├── documents/
│   │   ├── DocumentUpload.tsx
│   │   ├── DocumentList.tsx
│   │   ├── DocumentCard.tsx
│   │   └── PIIWarningModal.tsx
│   ├── goals/
│   │   ├── ValueCard.tsx
│   │   ├── GoalCard.tsx
│   │   ├── TaskCard.tsx
│   │   ├── GoalHierarchy.tsx
│   │   └── GoalEditor.tsx
│   ├── dashboard/
│   │   ├── KanbanBoard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── PrintableList.tsx
│   │   └── ProgressRing.tsx
│   └── email/
│       └── EmailPreferences.tsx
├── lib/
│   ├── documents/
│   │   ├── storage.ts
│   │   ├── extraction.ts
│   │   └── validation.ts
│   ├── goals/
│   │   ├── extraction.ts        # AI goal extraction
│   │   └── reassessment.ts      # Calculate reassessment date
│   └── email/
│       ├── service.ts
│       ├── templates.ts
│       └── scheduler.ts
└── types/
    └── goals.ts
```

---

## 🎨 UI/UX Specifications

### Dashboard - Kanban (Default)
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard          [Kanban] [Calendar] [Print]   ⚙️ 🔔    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  TO DO (5)   │  │ IN PROGRESS  │  │  COMPLETED   │      │
│  ├──────────────┤  │     (2)      │  │     (12)     │      │
│  │ ┌──────────┐ │  ├──────────────┤  ├──────────────┤      │
│  │ │ Task 1   │ │  │ ┌──────────┐ │  │ ┌──────────┐ │      │
│  │ │ Due: Mon │ │  │ │ Task 3   │ │  │ │ Task 5   │ │      │
│  │ │ Goal: X  │ │  │ │ Goal: Y  │ │  │ │ ✓ Done   │ │      │
│  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │      │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │              │      │
│  │ │ Task 2   │ │  │ │ Task 4   │ │  │              │      │
│  │ └──────────┘ │  │ └──────────┘ │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ── Values & Goals Overview ──────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Family First                              85% ━━━│   │
│  │    └─ Be present for kids (3/4 tasks done)         │   │
│  │    └─ Weekly date night (on track)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Responsive
- Kanban columns stack vertically on mobile
- Swipe to change columns
- Bottom navigation: Dashboard | Goals | Profile | Chat

### Printable View
- Clean black/white design
- No interactive elements
- Includes: Values, Goals, Tasks with deadlines
- Optional: Shareable link (read-only, expires in 7 days)

---

## 📧 Email Templates

### Weekly Digest
```
Subject: Your Aythya Weekly Update - 3 tasks due this week

Hi [Name],

Here's your week ahead:

📅 THIS WEEK
• Task 1 - Due Monday (Goal: Career Growth)
• Task 2 - Due Wednesday (Goal: Health)
• Task 3 - Due Friday (Goal: Relationships)

✅ LAST WEEK
You completed 5 of 7 tasks. Great progress!

💡 FOCUS AREA
Based on your progress, consider focusing on [Health] this week - 
you're slightly behind on your fitness goals.

[View Dashboard] [Adjust Reminders]

---
Aythya Strategy - Your personal strategic plan
Unsubscribe | Email Preferences
```

### Deadline Reminder
```
Subject: ⏰ Task due tomorrow: "Complete resume update"

Hi [Name],

Quick reminder - you have a task due tomorrow:

📋 Complete resume update
🎯 Part of: Career Growth
📅 Due: February 11, 2026

[Mark Complete] [Extend Deadline] [View Task]

---
Aythya Strategy
```

---

## ⚙️ Configuration

### Environment Variables (New)
```env
# Email Service (Resend recommended)
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@aythya.io

# Document Processing
MAX_DOCUMENT_SIZE_MB=10
ALLOWED_FILE_TYPES=pdf,docx,png,jpg,jpeg

# Cron Jobs
CRON_SECRET=your-cron-secret-key
```

### Cron Jobs Required
| Job | Frequency | Purpose |
|-----|-----------|---------|
| send-daily-digest | Daily 9am (per timezone) | Send daily digest emails |
| send-weekly-digest | Weekly Sunday 9am | Send weekly summaries |
| check-deadlines | Daily midnight | Queue deadline reminders |
| quarterly-summary | Quarterly | Send quarterly reviews |
| document-expiry-check | Daily | Send 30-day expiry warnings |
| cleanup-expired-docs | Daily | Delete expired documents |

---

## 🚀 Implementation Priority

### Phase 1: Document Uploads (Week 1)
1. Database schema + RLS
2. Storage bucket setup
3. Upload UI + consent flow
4. Basic Claude context integration

### Phase 2: Goals System (Week 2)
1. Values/Goals/Tasks CRUD
2. AI extraction from plan conversations
3. Goal confirmation UI in plan flow
4. Dashboard - basic list view

### Phase 3: Dashboard (Week 3)
1. Kanban board
2. Calendar view
3. Printable view
4. Mobile responsiveness

### Phase 4: Email System (Week 4)
1. Email service setup (Resend)
2. Preference management
3. Digest templates
4. Cron job deployment

---

## 📝 Notes

### AI Context Integration
When Claude processes conversations, include document context:
```typescript
const userContext = `
## User Background (from uploaded documents)
${user.documents.resume ? `Resume summary: ${user.documents.resume.extractedText}` : ''}
${user.documents.disc ? `DISC Profile: ${user.documents.disc.extractedText}` : ''}
${user.documents.strengthsfinder ? `Top Strengths: ${user.documents.strengthsfinder.extractedText}` : ''}
// etc.

Use this background to personalize advice, but ONLY reference specifics when relevant.
`;
```

### Reassessment Calculation
```typescript
function calculateReassessmentDate(goals: Goal[]): Date {
  const goalCount = goals.length;
  const avgTimeframe = calculateAverageTimeframe(goals);
  
  // Light load: 12 months
  // Medium load: 6-8 months
  // Heavy load: 3-4 months
  if (goalCount <= 3 && avgTimeframe === 'yearly') return addMonths(now, 12);
  if (goalCount <= 6) return addMonths(now, 8);
  if (goalCount <= 10) return addMonths(now, 6);
  return addMonths(now, 3);
}
```
