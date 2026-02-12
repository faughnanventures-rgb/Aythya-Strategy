# Integration Guide: Goals, Documents & Email Features

This guide explains how to integrate the new features into the existing Aythya Strategy app.

## 1. Update Claude System Prompt (claude.ts)

Add this function to include document context when generating AI responses:

```typescript
// In src/lib/ai/claude.ts

import { buildDocumentContext } from '@/lib/goals/extraction';

/**
 * Fetch user documents and build context for Claude
 */
async function getUserDocumentContext(supabase: any, userId: string): Promise<string> {
  const { data: documents } = await supabase
    .from('user_documents')
    .select('document_type, custom_type_name, extracted_text')
    .eq('user_id', userId)
    .eq('consent_given', true);

  if (!documents?.length) return '';

  return buildDocumentContext(documents);
}

/**
 * Updated system prompt builder that includes document context
 */
function buildSystemPromptWithContext(
  basePrompt: string,
  phasePrompt: string,
  documentContext?: string
): string {
  let systemPrompt = basePrompt + '\n\n' + phasePrompt;

  if (documentContext) {
    systemPrompt += `\n\n## User Background (from uploaded documents)

${documentContext}

**How to use this context:**
- Reference this information when it's relevant to the conversation
- Use their strengths from StrengthsFinder when discussing what they're good at
- Consider their DISC/PI profile when discussing communication or work style
- Draw on their resume for career history context
- ONLY mention specifics when directly relevant - don't force references
- Ask if you're unsure: "I noticed from your resume that... is that still relevant?"
`;
  }

  return systemPrompt;
}
```

## 2. Add Goals Phase to Plan Flow

Update the phase order to include a goals confirmation phase at the end:

```typescript
// In src/types/index.ts

export type PlanPhase = 
  | 'current_state'
  | 'energy_audit'
  | 'minimum_viable_stability'
  | 'strategic_pillars'
  | 'tactical_mapping'
  | 'goal_setting'
  | 'relationship_audit'
  | 'reflection'
  | 'goals_confirmation'; // NEW - final phase

// In src/lib/ai/claude.ts - add to PHASE_PROMPTS

goals_confirmation: `## Phase 9: Goals & Values Confirmation - 10-15 minutes

Based on everything we've discussed, you now need to help the user finalize their personal strategic plan with concrete goals.

**Your Task:**
1. Summarize the 2-4 core VALUES you've identified from the conversation
2. Present 3-7 specific GOALS organized under those values
3. For each goal, suggest 1-2 immediate TASKS/next steps
4. Mark any stretch aspirations as "reach goals"

**Format your suggestions clearly:**
"Based on our conversation, here are the values, goals, and next steps I've identified. Let's go through these together and adjust anything that doesn't feel right."

**For each value:**
- State the value clearly
- Explain why it emerged from your conversation
- List 1-3 goals under it

**For each goal:**
- Make it specific and measurable
- Suggest a timeframe (weekly/monthly/quarterly/yearly)
- Identify if it's a "reach goal" (stretch target)
- List 1-2 immediate next steps

**Confirm ownership:**
After presenting, ask:
- "Does this capture what matters most to you?"
- "Any goals that don't feel right or are missing?"
- "What timeframes feel realistic?"
- "Which of these excites you most? Which feels hardest?"

**The user needs to feel ownership.** This is THEIR plan, not yours. Adjust based on their feedback until they say "yes, this feels right."

When they confirm, let them know their goals will be saved to their dashboard where they can track progress.
`,
```

## 3. Update Plan Completion Handler

When a plan is marked complete, extract and save goals:

```typescript
// In src/app/api/plan/[id]/complete/route.ts

import { extractGoalsFromConversation, saveExtractedGoals } from '@/lib/goals/extraction';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const planId = params.id;

  // Get all messages from the plan
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });

  // Get user's document context
  const { data: documents } = await supabase
    .from('user_documents')
    .select('document_type, custom_type_name, extracted_text')
    .eq('user_id', user.id);

  const documentContext = buildDocumentContext(documents || []);

  // Extract goals from conversation
  const extraction = await extractGoalsFromConversation(
    messages.map(m => ({ role: m.role, content: m.content })),
    { includeDocumentContext: true, documentContext }
  );

  // Save extracted goals
  const saved = await saveExtractedGoals(supabase, user.id, planId, extraction);

  // Mark plan as complete
  await supabase
    .from('plans')
    .update({ 
      status: 'complete',
      completed_at: new Date().toISOString()
    })
    .eq('id', planId);

  return NextResponse.json({
    success: true,
    extraction: {
      values: extraction.values.length,
      goals: extraction.goals.length,
      tasks: extraction.tasks.length,
      reassessment: extraction.reassessment_recommendation
    },
    saved
  });
}
```

## 4. Add Document Upload to Onboarding

Update the onboarding flow to include document upload step:

```tsx
// In src/app/onboarding/page.tsx

import { DocumentUpload } from '@/components/documents/DocumentUpload';

// Add step in onboarding flow
{step === 'documents' && (
  <div className="max-w-2xl mx-auto">
    <DocumentUpload 
      showInOnboarding={true}
      onUploadComplete={(doc) => {
        console.log('Document uploaded:', doc);
      }}
    />
    <button onClick={goToNextStep} className="btn-primary mt-6 w-full">
      Continue to Planning
    </button>
  </div>
)}
```

## 5. Add Navigation to Dashboard

Update the main navigation to include dashboard link:

```tsx
// In src/components/Navigation.tsx

<nav>
  <Link href="/dashboard" className="nav-link">
    <LayoutGrid className="w-5 h-5" />
    Dashboard
  </Link>
  <Link href="/plan/new" className="nav-link">
    <Target className="w-5 h-5" />
    New Plan
  </Link>
  <Link href="/profile" className="nav-link">
    <User className="w-5 h-5" />
    Profile
  </Link>
</nav>
```

## 6. Environment Variables

Add these to your `.env.local`:

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxx
EMAIL_FROM=Aythya Strategy <noreply@aythya.io>

# Cron Job Secret (for Vercel cron)
CRON_SECRET=your-random-secret-string
```

## 7. Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/deadline-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/document-expiry",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 8. Install New Dependencies

```bash
npm install resend pdf-parse mammoth
```

## 9. Run Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `migrations/001_goals_and_documents.sql`
3. Verify tables were created

## 10. Testing Checklist

- [ ] Document upload works with PII warning
- [ ] Documents appear in user profile
- [ ] Claude uses document context in conversations
- [ ] Goals extraction runs on plan completion
- [ ] Dashboard shows values/goals/tasks
- [ ] Kanban drag-and-drop works
- [ ] Calendar view shows deadlines
- [ ] Print view generates correctly
- [ ] Email preferences save correctly
- [ ] Reminder emails send (test with Resend test mode)

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   ├── documents/upload/route.ts     # Document upload API
│   │   ├── goals/route.ts                # Goals CRUD API
│   │   ├── email-preferences/route.ts    # Email prefs API
│   │   └── cron/                         # Cron job handlers
│   ├── dashboard/page.tsx                # Main dashboard
│   ├── profile/documents/page.tsx        # Document management
│   └── settings/email/page.tsx           # Email settings
├── components/
│   ├── documents/
│   │   └── DocumentUpload.tsx
│   ├── goals/
│   │   └── GoalHierarchy.tsx
│   ├── dashboard/
│   │   ├── KanbanBoard.tsx
│   │   ├── CalendarView.tsx
│   │   └── PrintableList.tsx
│   └── email/
│       └── EmailPreferences.tsx
├── lib/
│   ├── goals/extraction.ts               # AI goal extraction
│   └── email/service.ts                  # Email sending
└── types/
    └── goals.ts                          # Type definitions
```
