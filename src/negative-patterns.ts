/**
 * Negative pattern detection — Layer 1 of the extraction pipeline.
 *
 * Rejects messages that look like AI meta-talk, first-person recall,
 * remind-me patterns, assistant-generated list output, or system-injected content.
 * Does NOT reject negation ("never use X") — those are valid constraints.
 */

/** Maximum message length for extraction — anything longer is likely a dump, not human conversation. */
const MAX_EXTRACTABLE_LENGTH = 1500

/** Patterns that indicate system-injected content (bootstrap, notifications, delegation). */
const SYSTEM_INJECTION_PATTERNS: RegExp[] = [
  /\[SESSION BOOTSTRAP/i,
  /## Memory Database/,
  /## Constraints\b/,
  /<system-reminder>/i,
  /<\/system-reminder>/i,
  /<!-- OMO_INTERNAL_INITIATOR -->/,
  /^\d+\.\s*TASK:/m,
  /EXPECTED OUTCOME:/,
  /MUST NOT DO:/,
  /REQUIRED TOOLS:/,
  /brain\/omo-memory (?:capture|recall|bootstrap)/,
  /\[BACKGROUND TASK COMPLETED\]/,
  /background_output\(task_id=/,
  /^Instructions from:/m,
  /^\[Agent Usage Reminder\]/m,
]

/** Mode prefix injections from keyword-detector hook. */
const MODE_PREFIX_PATTERNS: RegExp[] = [
  /^\[(?:analyze|search|ultrawork|prove-yourself)-mode\]/i,
  /^ANALYSIS MODE\./i,
  /^MAXIMIZE SEARCH EFFORT\./i,
]

/** Request intent — user asking assistant to perform an action, not stating preference. */
const REQUEST_INTENT_PATTERNS: RegExp[] = [
  /^i (?:want|need) (?:to see|to know|to check|you to|to look|to understand|to get|to be able)\b/i,
  /^i (?:want|need) (?:as much|some|more|the|a )\b/i,
  /^(?:show me|give me|tell me|let me see|let's see)\b/i,
]

/** Frustration or feedback directed at assistant — not real preferences/constraints. */
const FRUSTRATION_PATTERNS: RegExp[] = [
  /^you (?:always|never|keep|are |don'?t|have |were |should|look |forgot|miss)/i,
  /^(?:you are running|you look at wrong|that was the simple)/i,
]

/** Patterns that indicate AI meta-talk / assistant boilerplate. */
const AI_META_PATTERNS: RegExp[] = [
  /^let me (?:analyze|examine|look at|review|check|investigate|explore)/i,
  /^i(?:'ll| will) (?:analyze|examine|look at|review|check|investigate|help)/i,
  /^(?:here(?:'s| is) (?:a |my |the )?(?:summary|analysis|overview|breakdown|plan))/i,
  /^(?:based on (?:my|the) (?:analysis|review|examination))/i,
  /^summary:/i,
  /^goal:/i,
  /^(?:key )?(?:findings|observations|takeaways):/i,
  /^(?:step \d|phase \d|first|next|finally),?\s/i,
  /^\|.+\|/,               // markdown table row
  /^#{1,3}\s/,    // markdown heading
]

/** Patterns that indicate first-person recall (recounting, not preference). */
const RECALL_PATTERNS: RegExp[] = [
  /^i remember (?:when|that time|back when|how)/i,
  /^(?:back|last time) when (?:i|we) /i,
  /^(?:as i recall|if i recall|from what i remember)/i,
]

/** Patterns that indicate "remind me" requests (asking AI, not stating preference). */
const REMIND_PATTERNS: RegExp[] = [
  /(?:can you |please )?remind me (?:to|about|when|how)/i,
  /(?:don't let me forget|make sure i remember)/i,
  /^remind:/i,
]

/** Patterns that indicate assistant-generated list output (not user preferences). */
const ASSISTANT_LIST_PATTERNS: RegExp[] = [
  /(?:^\d+\.\s.+$\n?){3,}/m,   // numbered list with 3+ items across lines
  /(?:^[-*]\s.+$\n?){3,}/m,     // bullet list with 3+ items across lines
]

/** Question-only patterns — includes contractions (don't, isn't, etc.). */
const QUESTION_ONLY_PATTERNS: RegExp[] = [
  /^(?:how|what|where|when|why|which|who|is|are|can|could|would|should|do|does|did) .+\?$/i,
  /^(?:don'?t|doesn'?t|didn'?t|won'?t|wouldn'?t|shouldn'?t|isn'?t|aren'?t|haven'?t|hasn'?t|weren'?t|wasn'?t) .+\?$/i,
]

export interface NegativeMatchResult {
  rejected: boolean
  pattern?: string
}

/**
 * Check if a message matches any negative pattern.
 * Returns rejected=true if the message should be skipped.
 */
export function matchesNegativePattern(
  text: string,
  role: "user" | "assistant"
): NegativeMatchResult {
  const trimmed = text.trim()
  if (!trimmed) return { rejected: true, pattern: "empty" }

  // Length guard — messages over 1500 chars are dumps, not human conversation
  if (trimmed.length > MAX_EXTRACTABLE_LENGTH) {
    return { rejected: true, pattern: "too_long" }
  }

  // System injection — bootstrap, notifications, delegation prompts
  for (const pat of SYSTEM_INJECTION_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "system_injection" }
  }

  // Mode prefix injections (keyword-detector hook)
  for (const pat of MODE_PREFIX_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "mode_prefix" }
  }

  // Request intent — asking for action, not stating preference
  for (const pat of REQUEST_INTENT_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "request_intent" }
  }

  // Frustration/feedback directed at assistant
  for (const pat of FRUSTRATION_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "frustration" }
  }

  for (const pat of AI_META_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "ai_meta_talk" }
  }

  for (const pat of RECALL_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "first_person_recall" }
  }

  for (const pat of REMIND_PATTERNS) {
    if (pat.test(trimmed)) return { rejected: true, pattern: "remind_request" }
  }

  // assistant-generated lists: only reject from assistant role
  if (role === "assistant") {
    for (const pat of ASSISTANT_LIST_PATTERNS) {
      if (pat.test(trimmed)) return { rejected: true, pattern: "assistant_list" }
    }
  }

  // pure questions (no explicit intent) — reject
  // but only short questions that are JUST questions, not "I prefer X. What do you think?"
  if (trimmed.length < 200) {
    for (const pat of QUESTION_ONLY_PATTERNS) {
      if (pat.test(trimmed)) return { rejected: true, pattern: "question_only" }
    }
  }

  return { rejected: false }
}
