/**
 * @nous-labs/auto-extract — Standalone auto-extraction pipeline
 * for implicit memory capture from conversation messages.
 *
 * Usage:
 *   import { extractFromMessages, buildCaptureMetadata, classifyMessage } from "@nous-labs/auto-extract"
 */

export { extractFromMessages, buildCaptureMetadata } from "./extractor"
export { classifyMessage } from "./classifier"
export { scoreText, scoreAllCategories } from "./signal-patterns"
export { matchesNegativePattern } from "./negative-patterns"
export { isRoleAllowed, requiresHigherAssistantThreshold } from "./role-filter"

export type {
  ConversationMessage,
  ExtractionCandidate,
  ExtractorConfig,
  ClassificationResult,
  CategoryScore,
  MemoryType,
  MessageRole,
  RejectionReason,
} from "./types"
