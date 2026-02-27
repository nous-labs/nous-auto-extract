/**
 * 3-layer classification pipeline for conversation messages.
 *
 * Layer 0: Explicit intent bypass ("remember this", "keep in mind") — runs FIRST
 * Layer 1: Negative pattern matching (AI meta-talk, recall, remind-me)
 * Layer 2: Multi-keyword scoring (primary + booster)
 * Layer 3: Confidence threshold + role validation
 */
import type { ClassificationResult, ConversationMessage, ExtractorConfig } from "./types"
import { matchesNegativePattern } from "./negative-patterns"
import { scoreText } from "./signal-patterns"
import { isRoleAllowed, requiresHigherAssistantThreshold } from "./role-filter"

const DEFAULT_CONFIDENCE_THRESHOLD = 0.5
const DEFAULT_ASSISTANT_THRESHOLD = 0.6

/** Explicit intent phrases — bypass all other layers when detected. */
const EXPLICIT_INTENT_PATTERNS: RegExp[] = [
  /(?:remember (?:this|that)|don'?t forget|keep in mind|note that|store this|save this|capture this)/i,
  /(?:always remember|important to (?:remember|note|know))/i,
  /(?:for future (?:reference|sessions)|going forward)/i,
]

/**
 * Check if text contains an explicit intent signal.
 * These bypass negative patterns but NOT role filtering.
 */
function detectExplicitIntent(text: string): boolean {
  return EXPLICIT_INTENT_PATTERNS.some((pat) => pat.test(text))
}

/**
 * Classify a single conversation message through the 3-layer pipeline.
 */
export function classifyMessage(
  message: ConversationMessage,
  config: ExtractorConfig = {}
): ClassificationResult {
  const threshold = config.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD
  const assistantThreshold = config.assistantThreshold ?? DEFAULT_ASSISTANT_THRESHOLD
  const text = message.content.trim()

  if (!text) {
    return { accepted: false, rejectionReason: "empty_content" }
  }

  // --- Layer 0: Explicit intent bypass ---
  const isExplicit = detectExplicitIntent(text)

  if (!isExplicit) {
    // --- Layer 1: Negative pattern matching ---
    const negativeResult = matchesNegativePattern(text, message.role)
    if (negativeResult.rejected) {
      return { accepted: false, rejectionReason: "negative_pattern" }
    }
  }

  // --- Layer 2: Multi-keyword scoring ---
  const scored = scoreText(text)
  if (!scored) {
    return { accepted: false, rejectionReason: "below_threshold" }
  }

  // Explicit intent gets a confidence floor of 0.85
  const confidence = isExplicit ? Math.max(scored.score, 0.85) : scored.score

  // --- Layer 3: Threshold + role validation ---
  const effectiveThreshold = requiresHigherAssistantThreshold(scored.type, message.role)
    ? assistantThreshold
    : threshold

  if (confidence < effectiveThreshold) {
    return {
      accepted: false,
      rejectionReason: "below_threshold",
      type: scored.type,
      confidence,
    }
  }

  if (!isRoleAllowed(scored.type, message.role)) {
    return {
      accepted: false,
      rejectionReason: "role_forbidden",
      type: scored.type,
      confidence,
    }
  }

  return {
    accepted: true,
    type: scored.type,
    confidence,
    content: text,
    explicitIntent: isExplicit,
    primaryMatches: scored.primaryMatches,
    boosterMatches: scored.boosterMatches,
  }
}
