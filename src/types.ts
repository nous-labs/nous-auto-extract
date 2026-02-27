/**
 * Core types for the auto-extraction pipeline.
 */

/** Memory types that can be auto-extracted. */
export type MemoryType = "decision" | "preference" | "constraint" | "failure" | "learning"

/** Role of the message author. */
export type MessageRole = "user" | "assistant"

/** A conversation message to classify. */
export interface ConversationMessage {
  id: string
  role: MessageRole
  content: string
  sessionId: string
}

/** Result of keyword scoring for a single category. */
export interface CategoryScore {
  type: MemoryType
  score: number
  primaryMatches: string[]
  boosterMatches: string[]
}

/** Reason a message was rejected. */
export type RejectionReason =
  | "negative_pattern"
  | "below_threshold"
  | "role_forbidden"
  | "empty_content"

/** Classification result for a single message. */
export interface ClassificationResult {
  accepted: boolean
  type?: MemoryType
  confidence?: number
  content?: string
  rejectionReason?: RejectionReason
  explicitIntent?: boolean
  primaryMatches?: string[]
  boosterMatches?: string[]
}

/** A candidate memory extracted from conversation. */
export interface ExtractionCandidate {
  type: MemoryType
  content: string
  confidence: number
  sourceMessageId: string
  sourceSessionId: string
  sourceRole: MessageRole
  explicitIntent: boolean
}

/** Pipeline configuration. */
export interface ExtractorConfig {
  /** Minimum confidence score to accept (default: 0.5). */
  confidenceThreshold?: number
  /** Higher threshold for assistant-sourced failure/learning (default: 0.6). */
  assistantThreshold?: number
  /** Extractor version string for metadata. */
  extractorVersion?: string
}
