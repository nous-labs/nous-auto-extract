/**
 * Role-based filtering — Layer 3 (partial) of the extraction pipeline.
 *
 * Determines whether a memory type can be extracted from a given role:
 * - preference, constraint, decision → human-only (user messages)
 * - failure, learning → both human and assistant (with higher threshold for assistant)
 */
import type { MemoryType, MessageRole } from "./types"

/** Types that REQUIRE human source — expressing user intent. */
const HUMAN_ONLY_TYPES: ReadonlySet<MemoryType> = new Set([
  "preference",
  "constraint",
  "decision",
])

/** Types that allow assistant source — factual observations. */
const BOTH_ROLES_TYPES: ReadonlySet<MemoryType> = new Set([
  "failure",
  "learning",
])

/**
 * Check if a memory type is allowed from a given role.
 */
export function isRoleAllowed(type: MemoryType, role: MessageRole): boolean {
  if (HUMAN_ONLY_TYPES.has(type)) {
    return role === "user"
  }
  if (BOTH_ROLES_TYPES.has(type)) {
    return true
  }
  // unknown type — default deny
  return false
}

/**
 * Whether this type requires a higher confidence threshold from assistant messages.
 */
export function requiresHigherAssistantThreshold(type: MemoryType, role: MessageRole): boolean {
  return BOTH_ROLES_TYPES.has(type) && role === "assistant"
}
