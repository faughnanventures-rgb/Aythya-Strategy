/**
 * Report Generation Utilities
 * 
 * Generates various report formats from strategic plans:
 * - One-page summary (quick reference)
 * - Full report (comprehensive document)
 * - Shareable link format
 */

import type { StrategicPlan, PlanPhase, ConversationMessage } from '@/types';

// ============================================
// TYPES
// ============================================

export interface ReportSection {
  title: string;
  phase: PlanPhase;
  content: string;
  keyInsights: string[];
  actionItems: string[];
}

export interface OnePagerData {
  title: string;
  createdAt: string;
  summary: string;
  pillars: string[];
  topGoals: string[];
  keyInsights: string[];
  nextSteps: string[];
}

export interface FullReportData {
  title: string;
  createdAt: string;
  completedAt: string | null;
  status: string;
  sections: ReportSection[];
  conversationHighlights: string[];
  overallProgress: number;
}

// ============================================
// EXTRACTION HELPERS
// ============================================

/**
 * Extract key insights from conversation history
 */
export function extractInsights(messages: ConversationMessage[]): string[] {
  const insights: string[] = [];
  
  // Look for patterns in assistant messages
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  for (const msg of assistantMessages) {
    const content = msg.content.toLowerCase();
    
    // Look for insight indicators
    if (content.includes('pattern') || 
        content.includes('notice') || 
        content.includes('interesting') ||
        content.includes('sounds like') ||
        content.includes('it seems')) {
      // Extract the sentence containing the insight
      const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim());
      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();
        if ((lower.includes('pattern') || 
             lower.includes('notice') || 
             lower.includes('sounds like') ||
             lower.includes('it seems')) &&
            sentence.length > 20 && 
            sentence.length < 300) {
          insights.push(sentence.trim());
        }
      }
    }
  }
  
  return insights.slice(0, 10); // Limit to top 10
}

/**
 * Extract action items from conversation
 */
export function extractActionItems(messages: ConversationMessage[]): string[] {
  const actions: string[] = [];
  
  for (const msg of messages) {
    const content = msg.content;
    
    // Look for action-oriented language
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if ((lower.includes('you could') || 
           lower.includes('consider') ||
           lower.includes('try') ||
           lower.includes('start') ||
           lower.includes('next step') ||
           lower.includes('action')) &&
          sentence.length > 15 && 
          sentence.length < 200 &&
          msg.role === 'assistant') {
        actions.push(sentence.trim());
      }
    }
  }
  
  return Array.from(new Set(actions)).slice(0, 10); // Dedupe and limit
}

/**
 * Extract pillars from strategic pillars phase
 */
export function extractPillars(messages: ConversationMessage[]): string[] {
  const pillars: string[] = [];
  
  // Look in user messages for pillar declarations
  const userMessages = messages.filter(m => m.role === 'user');
  
  for (const msg of userMessages) {
    const content = msg.content;
    
    // Common pillar keywords
    const keywords = [
      'health', 'career', 'financial', 'relationship', 'family',
      'creative', 'learning', 'growth', 'stability', 'income',
      'wellness', 'community', 'spiritual', 'purpose'
    ];
    
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        // Find the sentence with this keyword
        const sentences = content.split(/[.!?\n]+/).filter(s => s.trim());
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword) && 
              sentence.length > 10 && 
              sentence.length < 150) {
            pillars.push(sentence.trim());
          }
        }
      }
    }
  }
  
  return Array.from(new Set(pillars)).slice(0, 5);
}

/**
 * Extract goals from goal setting phase
 */
export function extractGoals(messages: ConversationMessage[]): string[] {
  const goals: string[] = [];
  
  const userMessages = messages.filter(m => m.role === 'user');
  
  for (const msg of userMessages) {
    const content = msg.content;
    
    // Look for goal indicators
    const sentences = content.split(/[.!?\n]+/).filter(s => s.trim());
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if ((lower.includes('want to') || 
           lower.includes('goal') ||
           lower.includes('plan to') ||
           lower.includes('will') ||
           lower.includes('aim') ||
           lower.includes('by ')) &&
          sentence.length > 15 && 
          sentence.length < 200) {
        goals.push(sentence.trim());
      }
    }
  }
  
  return Array.from(new Set(goals)).slice(0, 10);
}

/**
 * Generate a summary from conversation
 */
export function generateSummary(
  _phase: PlanPhase, 
  messages: ConversationMessage[]
): string {
  if (messages.length === 0) {
    return 'This phase has not been started yet.';
  }
  
  // Get the last few assistant messages for context
  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .slice(-3);
  
  if (assistantMessages.length === 0) {
    return 'No insights captured in this phase yet.';
  }
  
  // Combine and truncate for summary
  const combined = assistantMessages
    .map(m => m.content)
    .join(' ')
    .substring(0, 500);
  
  return combined + (combined.length >= 500 ? '...' : '');
}

// ============================================
// REPORT GENERATORS
// ============================================

/**
 * Generate one-page summary
 */
export async function generateOnePager(
  plan: StrategicPlan,
  conversations: Record<PlanPhase, ConversationMessage[]>
): Promise<OnePagerData> {
  const allMessages = Object.values(conversations).flat();
  
  // Extract key data
  const pillars = extractPillars(conversations.strategic_pillars || []);
  const goals = extractGoals(conversations.goal_setting || []);
  const insights = extractInsights(allMessages);
  const actions = extractActionItems(allMessages);
  
  // Build summary
  let summary = '';
  if (conversations.current_state?.length > 0) {
    const stateMessages = conversations.current_state
      .filter(m => m.role === 'user')
      .slice(0, 3)
      .map(m => m.content)
      .join(' ');
    summary = stateMessages.substring(0, 300) + '...';
  }
  
  return {
    title: plan.title,
    createdAt: new Date(plan.createdAt).toLocaleDateString(),
    summary: summary || 'Strategic plan in progress.',
    pillars: pillars.length > 0 ? pillars : ['Define your core focus areas'],
    topGoals: goals.length > 0 ? goals.slice(0, 5) : ['Set meaningful goals'],
    keyInsights: insights.length > 0 ? insights.slice(0, 5) : ['Continue exploring'],
    nextSteps: actions.length > 0 ? actions.slice(0, 5) : ['Complete remaining phases'],
  };
}

/**
 * Generate full comprehensive report
 */
export async function generateFullReport(
  plan: StrategicPlan,
  conversations: Record<PlanPhase, ConversationMessage[]>
): Promise<FullReportData> {
  const phases: PlanPhase[] = [
    'current_state',
    'energy_audit',
    'minimum_viable_stability',
    'strategic_pillars',
    'tactical_mapping',
    'goal_setting',
    'relationship_audit',
    'reflection',
  ];
  
  const phaseNames: Record<PlanPhase, string> = {
    current_state: 'Current State Analysis',
    energy_audit: 'Energy Audit',
    minimum_viable_stability: 'Minimum Viable Stability',
    strategic_pillars: 'Strategic Pillars',
    tactical_mapping: 'Tactical Mapping',
    goal_setting: 'Goals & Milestones',
    relationship_audit: 'Relationship Audit',
    reflection: 'Reflection & Meaning',
    completed: 'Summary',
  };
  
  const sections: ReportSection[] = phases.map(phase => {
    const messages = conversations[phase] || [];
    return {
      title: phaseNames[phase],
      phase,
      content: generateSummary(phase, messages),
      keyInsights: extractInsights(messages),
      actionItems: extractActionItems(messages),
    };
  });
  
  // Calculate progress
  const completedPhases = phases.filter(p => 
    (conversations[p]?.length || 0) > 2
  ).length;
  const overallProgress = Math.round((completedPhases / phases.length) * 100);
  
  // Get conversation highlights
  const allMessages = Object.values(conversations).flat();
  const highlights = extractInsights(allMessages);
  
  return {
    title: plan.title,
    createdAt: new Date(plan.createdAt).toLocaleDateString(),
    completedAt: plan.completedAt 
      ? new Date(plan.completedAt).toLocaleDateString() 
      : null,
    status: plan.status,
    sections,
    conversationHighlights: highlights,
    overallProgress,
  };
}

// ============================================
// MARKDOWN FORMATTERS
// ============================================

/**
 * Format one-pager as markdown
 */
export function formatOnePagerMarkdown(data: OnePagerData): string {
  return `# ${data.title}

**Created:** ${data.createdAt}

---

## Overview

${data.summary}

---

## Strategic Pillars

${data.pillars.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---

## Top Goals

${data.topGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

---

## Key Insights

${data.keyInsights.map(i => `- ${i}`).join('\n')}

---

## Next Steps

${data.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

*Generated by Aythya Strategy*
`;
}

/**
 * Format full report as markdown
 */
export function formatFullReportMarkdown(data: FullReportData): string {
  let markdown = `# Strategic Plan: ${data.title}

**Created:** ${data.createdAt}
${data.completedAt ? `**Completed:** ${data.completedAt}` : '**Status:** In Progress'}
**Progress:** ${data.overallProgress}%

---

`;

  // Add each section
  for (const section of data.sections) {
    markdown += `## ${section.title}

${section.content}

`;

    if (section.keyInsights.length > 0) {
      markdown += `### Key Insights

${section.keyInsights.map(i => `- ${i}`).join('\n')}

`;
    }

    if (section.actionItems.length > 0) {
      markdown += `### Action Items

${section.actionItems.map(a => `- [ ] ${a}`).join('\n')}

`;
    }

    markdown += '---\n\n';
  }

  // Add highlights
  if (data.conversationHighlights.length > 0) {
    markdown += `## Overall Insights

${data.conversationHighlights.map(h => `- ${h}`).join('\n')}

---

`;
  }

  markdown += `*Generated by Aythya Strategy on ${new Date().toLocaleDateString()}*\n`;

  return markdown;
}

// ============================================
// HTML FORMATTERS (for better styling)
// ============================================

/**
 * Format one-pager as HTML
 */
export function formatOnePagerHTML(data: OnePagerData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - One Page Summary</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px 20px;
      color: #1c1917;
      line-height: 1.6;
    }
    h1 { 
      font-size: 28px; 
      color: #1c1917;
      margin-bottom: 8px;
      font-weight: 600;
    }
    h2 { 
      font-size: 18px; 
      color: #57534e;
      margin: 24px 0 12px;
      font-weight: 600;
      border-bottom: 2px solid #6b8e6b;
      padding-bottom: 4px;
    }
    .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
    .summary { 
      background: #fafaf9; 
      padding: 16px; 
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid #6b8e6b;
    }
    ul, ol { margin-left: 20px; }
    li { margin: 8px 0; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      color: #a8a29e;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <p class="meta">Created: ${data.createdAt}</p>
  
  <div class="summary">
    <p>${data.summary}</p>
  </div>
  
  <h2>Strategic Pillars</h2>
  <ol>
    ${data.pillars.map(p => `<li>${p}</li>`).join('\n    ')}
  </ol>
  
  <h2>Top Goals</h2>
  <ol>
    ${data.topGoals.map(g => `<li>${g}</li>`).join('\n    ')}
  </ol>
  
  <h2>Key Insights</h2>
  <ul>
    ${data.keyInsights.map(i => `<li>${i}</li>`).join('\n    ')}
  </ul>
  
  <h2>Next Steps</h2>
  <ol>
    ${data.nextSteps.map(s => `<li>${s}</li>`).join('\n    ')}
  </ol>
  
  <p class="footer">Generated by Aythya Strategy</p>
</body>
</html>`;
}
