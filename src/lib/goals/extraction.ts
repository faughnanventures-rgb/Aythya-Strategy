/**
 * AI Goal Extraction
 * 
 * Analyzes plan conversations to extract and suggest:
 * - Values (core priorities)
 * - Goals (SMART-like objectives)
 * - Tasks (specific action items)
 * - Reassessment timeline recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import type { 
  GoalExtractionResult, 
  ExtractedGoalSuggestion,
  GoalTimeframe 
} from '@/types/goals';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

const EXTRACTION_PROMPT = `You are analyzing a completed strategic planning conversation to extract actionable goals, values, and tasks.

## Your Task

Based on the conversation transcript, identify and extract:

1. **VALUES** (2-4 core priorities)
   - What matters most to this person
   - Their guiding principles
   - Life priorities they've explicitly or implicitly stated

2. **GOALS** (3-7 specific objectives)
   - Concrete outcomes they want to achieve
   - Should be measurable (quantitative or qualitative)
   - Include "reach goals" for stretch aspirations they mentioned
   - Each goal should connect to a value

3. **TASKS** (1-3 per goal)
   - Specific next actions
   - First steps they can take immediately
   - Clear and actionable

4. **REASSESSMENT RECOMMENDATION**
   - Based on their goal load and timeframes
   - Light load (≤3 goals, yearly timeframe): 12 months
   - Medium load (4-6 goals): 6-8 months
   - Heavy load (7+ goals or tight deadlines): 3-4 months

## Output Format

Return ONLY valid JSON in this exact format:

{
  "values": [
    {
      "title": "Value name",
      "description": "Brief description",
      "confidence": 0.9,
      "source_quote": "Direct quote from user that indicates this value"
    }
  ],
  "goals": [
    {
      "title": "Goal name",
      "description": "What success looks like",
      "parent_title": "Related value title",
      "measurement_suggestion": "How to measure progress",
      "timeframe_suggestion": "quarterly",
      "is_reach_goal": false,
      "confidence": 0.85,
      "source_phase": "strategic_pillars",
      "source_quote": "Direct quote from user"
    }
  ],
  "tasks": [
    {
      "title": "Task name",
      "description": "Specific action to take",
      "parent_title": "Related goal title",
      "confidence": 0.8,
      "source_quote": "Quote indicating this action"
    }
  ],
  "reassessment_recommendation": {
    "months": 6,
    "reason": "You have 5 goals across multiple areas with quarterly deadlines, so a 6-month check-in would help ensure you're on track."
  }
}

## Important Guidelines

- Only extract what the user ACTUALLY said or clearly implied
- Don't make up goals - confidence should reflect certainty
- Use their exact words where possible
- Goals should be SMART-like: Specific, Measurable, Achievable, Relevant, Time-bound
- Mark stretch aspirations as reach goals
- Timeframes: "weekly" | "monthly" | "quarterly" | "yearly" | "custom"
- If something is vague, note it with lower confidence

## Conversation Transcript
`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractionOptions {
  includeDocumentContext?: boolean;
  documentContext?: string;
}

export async function extractGoalsFromConversation(
  messages: ConversationMessage[],
  options: ExtractionOptions = {}
): Promise<GoalExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });

  // Build the transcript
  const transcript = messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  // Add document context if available
  let contextAddition = '';
  if (options.includeDocumentContext && options.documentContext) {
    contextAddition = `\n\n## User Background (from uploaded documents)\n${options.documentContext}\n\nUse this context to better understand the user's situation, but focus extraction on what was discussed in the conversation.\n`;
  }

  const prompt = EXTRACTION_PROMPT + contextAddition + '\n```\n' + transcript + '\n```';

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Validate and transform the response
    return validateAndTransform(extracted);

  } catch (error) {
    console.error('Goal extraction failed:', error);
    throw error;
  }
}

function validateAndTransform(data: any): GoalExtractionResult {
  // Validate values
  const values: ExtractedGoalSuggestion[] = (data.values || []).map((v: any) => ({
    type: 'value' as const,
    title: String(v.title || 'Untitled Value'),
    description: v.description ? String(v.description) : undefined,
    confidence: typeof v.confidence === 'number' ? v.confidence : 0.5,
    source_quote: v.source_quote ? String(v.source_quote) : undefined,
  }));

  // Validate goals
  const goals: ExtractedGoalSuggestion[] = (data.goals || []).map((g: any) => ({
    type: 'goal' as const,
    title: String(g.title || 'Untitled Goal'),
    description: g.description ? String(g.description) : undefined,
    parent_title: g.parent_title ? String(g.parent_title) : undefined,
    measurement_suggestion: g.measurement_suggestion ? String(g.measurement_suggestion) : undefined,
    timeframe_suggestion: validateTimeframe(g.timeframe_suggestion),
    is_reach_goal: Boolean(g.is_reach_goal),
    confidence: typeof g.confidence === 'number' ? g.confidence : 0.5,
    source_phase: g.source_phase ? String(g.source_phase) : undefined,
    source_quote: g.source_quote ? String(g.source_quote) : undefined,
  }));

  // Validate tasks
  const tasks: ExtractedGoalSuggestion[] = (data.tasks || []).map((t: any) => ({
    type: 'task' as const,
    title: String(t.title || 'Untitled Task'),
    description: t.description ? String(t.description) : undefined,
    parent_title: t.parent_title ? String(t.parent_title) : undefined,
    confidence: typeof t.confidence === 'number' ? t.confidence : 0.5,
    source_quote: t.source_quote ? String(t.source_quote) : undefined,
  }));

  // Validate reassessment
  const reassessment = {
    months: typeof data.reassessment_recommendation?.months === 'number' 
      ? data.reassessment_recommendation.months 
      : 6,
    reason: data.reassessment_recommendation?.reason 
      ? String(data.reassessment_recommendation.reason)
      : 'Based on your goal load, a 6-month check-in is recommended.',
  };

  return {
    values,
    goals,
    tasks,
    reassessment_recommendation: reassessment,
  };
}

function validateTimeframe(value: any): GoalTimeframe {
  const valid: GoalTimeframe[] = ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  if (valid.includes(value)) return value;
  return 'quarterly';
}

/**
 * Save extracted goals to database
 */
export async function saveExtractedGoals(
  supabase: any,
  userId: string,
  planId: string,
  extraction: GoalExtractionResult
): Promise<{
  savedValues: number;
  savedGoals: number;
  savedTasks: number;
}> {
  let savedValues = 0;
  let savedGoals = 0;
  let savedTasks = 0;

  // Map to track value titles to IDs
  const valueIdMap: Record<string, string> = {};

  // Save values
  for (const value of extraction.values) {
    const { data, error } = await supabase
      .from('user_values')
      .insert({
        user_id: userId,
        plan_id: planId,
        title: value.title,
        description: value.description,
        ai_suggested: true,
        user_confirmed: false,
        priority: savedValues,
      })
      .select('id')
      .single();

    if (!error && data) {
      valueIdMap[value.title] = data.id;
      savedValues++;
    }
  }

  // Map to track goal titles to IDs
  const goalIdMap: Record<string, string> = {};

  // Save goals
  for (const goal of extraction.goals) {
    const valueId = goal.parent_title ? valueIdMap[goal.parent_title] : null;

    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        plan_id: planId,
        value_id: valueId,
        title: goal.title,
        description: goal.description,
        goal_type: goal.is_reach_goal ? 'reach' : 'standard',
        measurement_type: goal.measurement_suggestion?.match(/\d/) ? 'quantitative' : 'qualitative',
        measurement_target: goal.measurement_suggestion,
        timeframe: goal.timeframe_suggestion || 'quarterly',
        ai_suggested: true,
        user_confirmed: false,
        priority: savedGoals,
      })
      .select('id')
      .single();

    if (!error && data) {
      goalIdMap[goal.title] = data.id;
      savedGoals++;
    }
  }

  // Save tasks
  for (const task of extraction.tasks) {
    const goalId = task.parent_title ? goalIdMap[task.parent_title] : null;
    
    if (!goalId) continue; // Tasks need a goal

    const { error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        goal_id: goalId,
        title: task.title,
        description: task.description,
        priority: savedTasks,
      });

    if (!error) {
      savedTasks++;
    }
  }

  // Save reassessment recommendation
  const reassessmentDate = new Date();
  reassessmentDate.setMonth(reassessmentDate.getMonth() + extraction.reassessment_recommendation.months);

  await supabase
    .from('plan_reassessments')
    .insert({
      user_id: userId,
      plan_id: planId,
      recommended_date: reassessmentDate.toISOString().split('T')[0],
      reason: extraction.reassessment_recommendation.reason,
    });

  return { savedValues, savedGoals, savedTasks };
}

/**
 * Build document context string for Claude
 */
export function buildDocumentContext(documents: Array<{
  document_type: string;
  custom_type_name?: string;
  extracted_text?: string;
}>): string {
  if (!documents?.length) return '';

  const sections: string[] = [];

  for (const doc of documents) {
    if (!doc.extracted_text) continue;

    const label = doc.document_type === 'custom' 
      ? doc.custom_type_name || 'Custom Document'
      : {
          resume: 'Resume Summary',
          disc: 'DISC Profile',
          strengthsfinder: 'StrengthsFinder Results',
          pi: 'Predictive Index Profile',
        }[doc.document_type] || doc.document_type;

    sections.push(`### ${label}\n${doc.extracted_text.substring(0, 2000)}`);
  }

  return sections.join('\n\n');
}
