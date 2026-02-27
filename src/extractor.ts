/**
 * Extraction orchestrator — processes batches of conversation messages
 * through the classification pipeline and returns extraction candidates.
 */
import type { ConversationMessage, ExtractionCandidate, ExtractorConfig } from "./types"
import { classifyMessage } from "./classifier"

const DEFAULT_EXTRACTOR_VERSION = "1.0"

/**
 * Extract memory candidates from a batch of conversation messages.
 *
 * Processes each message through the 3-layer classification pipeline
 * and returns accepted candidates with metadata for quarantine storage.
 */
export function extractFromMessages(
  messages: ConversationMessage[],
  config: ExtractorConfig = {}
): ExtractionCandidate[] {
  const candidates: ExtractionCandidate[] = []

  for (const message of messages) {
    const result = classifyMessage(message, config)
    if (!result.accepted || !result.type || !result.content) continue

    candidates.push({
      type: result.type,
      content: result.content,
      confidence: result.confidence!,
      sourceMessageId: message.id,
      sourceSessionId: message.sessionId,
      sourceRole: message.role,
      explicitIntent: result.explicitIntent ?? false,
    })
  }

  return candidates
}

/**
 * Build the metadata JSON string for a candidate, suitable for
 * `brain/omo-memory capture --metadata '...'`.
 */
export function buildCaptureMetadata(
  candidate: ExtractionCandidate,
  config: ExtractorConfig = {}
): string {
  return JSON.stringify({
    auto_extracted: true,
    confidence: candidate.confidence,
    source_session: candidate.sourceSessionId,
    source_message_id: candidate.sourceMessageId,
    source_role: candidate.sourceRole,
    explicit_intent: candidate.explicitIntent,
    extractor_version: config.extractorVersion ?? DEFAULT_EXTRACTOR_VERSION,
  })
}
