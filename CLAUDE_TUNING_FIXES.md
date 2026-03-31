# Claude Tuning Fixes — Memory & Anti-Hallucination

## Problems Identified

### 1. Poor Memory / Making Things Up
**Symptoms:**
- Claude states "facts" the user never shared
- Claude confuses this user with examples or other scenarios
- Claude gets locations, family situations, jobs wrong
- Claude "invents" details to fill gaps

**Root Causes:**
- Anti-hallucination rules were buried deep in the prompt (not prioritized)
- No structured way to track facts across messages
- No reminder of what user previously said

### 2. Repetitive Questions
**Symptoms:**
- Same questions asked in multiple phases
- "What do you do?" asked after user already explained their job
- "What's holding you back?" asked repeatedly
- User feels like Claude isn't listening

**Root Causes:**
- Each phase prompt had similar questions without cross-phase awareness
- No mechanism to track what was already asked
- Phase prompts didn't acknowledge prior context

---

## Fixes Applied

### Fix 1: Anti-Hallucination Rules at TOP of Prompt

The most critical rules MUST come first. Claude prioritizes what it reads first.

```typescript
const MEMORY_AND_ACCURACY_PROMPT = `## CRITICAL RULES — READ FIRST

### Rule 1: NEVER Fabricate Facts
You MUST ONLY state information the user has EXPLICITLY told you...

**Before you write ANYTHING about the user, verify:**
- Did they literally say this? → You can state it
- Are you inferring or assuming? → DO NOT state it. Ask instead.
`;
```

**Before:** Rules were in the middle of the prompt
**After:** Rules are the FIRST thing Claude reads

### Fix 2: Fact Summary Passed with Each Message

We now extract user messages and inject them as context:

```typescript
export function generateFactSummary(messages: ConversationMessage[]): string {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  return `
### Conversation Context So Far
The user has shared the following. ONLY reference facts from this list:

<previous_user_messages>
${userMessages}
</previous_user_messages>

Before stating any fact, verify it appears above.
`;
}
```

**Why this works:** Claude sees ALL prior user messages in a structured block and is reminded to only use facts from this block.

### Fix 3: Asked Questions Tracker

Prevents repeating questions:

```typescript
export function getAskedQuestionsContext(messages: ConversationMessage[]): string {
  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .slice(-5);

  return `
### Questions Already Asked
You have previously asked about these topics. DO NOT ask again:

<previous_questions>
${assistantMessages.join('\n---\n')}
</previous_questions>

To revisit a topic: "You mentioned [X] earlier. I'd like to explore that more..."
`;
}
```

### Fix 4: Deduplicated Phase Prompts

Added cross-phase skip rules to every phase:

```typescript
const CROSS_PHASE_SKIP_RULES = `
**Cross-Phase Awareness:**
- If they already shared their location, DON'T ask again
- If they mentioned their job/career, DON'T ask "what do you do"
- If they discussed family situation, DON'T ask about relationships from scratch
- If they mentioned constraints, DON'T ask "what's holding you back" — build on what they said
- If they shared strengths, DON'T ask "what are you good at" — reference their answers

Instead, USE their previous answers: "Given that you're in [their field]..."
`;
```

### Fix 5: "Reference, Don't Re-ask" Pattern

Changed question patterns from asking fresh to building on prior answers:

**Before:**
```
"What are your key focus areas?"
```

**After:**
```
"Based on what you've shared, it sounds like [career/health/relationships] might be key areas. Does that feel right?"
```

---

## How to Verify Fixes Work

### Test 1: Memory Test
1. In Phase 1, say "I live in Vermont and work as a teacher"
2. Continue through phases
3. **Check:** Does Claude ever say you're somewhere else or in a different job?
4. **Check:** Does Claude reference Vermont/teaching naturally in later phases?

### Test 2: Repetition Test
1. In Phase 1, share your constraints clearly
2. Move to Phase 4 (Strategic Pillars)
3. **Check:** Does Claude ask "what's holding you back?" again?
4. **Expected:** Claude should say "Given the [constraint] you mentioned earlier..."

### Test 3: Hallucination Test
1. Only mention that you're single, no kids
2. Continue through phases
3. **Check:** Does Claude ever mention spouse, partner, or children?
4. **Check:** Does Claude ever assume your career field without asking?

### Test 4: Self-Correction Test
1. If Claude does make a mistake, point it out
2. **Check:** Does Claude apologize and correct itself?
3. **Expected:** "I apologize — I misstated that. You said X, not Y."

---

## Integration Steps

1. **Replace** `/src/lib/ai/claude.ts` with the new `claude-tuned.ts` content

2. **Or merge** by adding these key sections:
   - `MEMORY_AND_ACCURACY_PROMPT` at the top
   - `generateFactSummary()` function
   - `getAskedQuestionsContext()` function
   - `CROSS_PHASE_SKIP_RULES` in each phase prompt
   - Update `buildSystemPrompt()` to call these functions

3. **Test thoroughly** with the verification tests above

---

## Prompt Structure (Final Order)

```
1. MEMORY_AND_ACCURACY_PROMPT (critical rules FIRST)
2. generateFactSummary() output (what user said)
3. getAskedQuestionsContext() output (what was asked)
4. documentContext (if uploaded documents)
5. BASE_SYSTEM_PROMPT (personality/style)
6. Phase-specific prompt (with skip rules)
```

The order matters. Claude prioritizes what comes first.

---

## Metrics to Track

After deploying, monitor:

1. **Hallucination reports** — Should decrease significantly
2. **"You already asked that" complaints** — Should drop to near zero
3. **Session completion rate** — Should improve (less frustration)
4. **User satisfaction** — Should increase with better memory

---

## If Problems Persist

1. **Check message history is being passed correctly** — All prior messages must be sent
2. **Verify system prompt is being built fresh each message** — Not cached
3. **Check for truncation** — Long conversations might be getting cut off
4. **Consider adding explicit fact extraction** — Have Claude output a fact sheet after each phase

Let me know if issues continue and I can investigate further.
