/**
 * Negative pattern detection — Layer 1 of the extraction pipeline.
 *
 * Rejects messages that look like AI meta-talk, first-person recall,
 * remind-me patterns, or assistant-generated list output.
 * Does NOT reject negation ("never use X") — those are valid constraints.
 */

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

/** Question-only patterns (but NOT "remember" questions — those are handled by Layer 0). */
const QUESTION_ONLY_PATTERNS: RegExp[] = [
  /^(?:how|what|where|when|why|which|who|is|are|can|could|would|should|do|does|did) .+\?$/i,
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
