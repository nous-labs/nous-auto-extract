import { describe, it, expect } from "bun:test"
import { extractFromMessages, buildCaptureMetadata } from "../src/extractor"
import type { ConversationMessage } from "../src/types"

function msg(role: "user" | "assistant", content: string, id?: string): ConversationMessage {
  return { id: id ?? `msg_${Math.random().toString(36).slice(2, 8)}`, role, content, sessionId: "ses_e2e" }
}

describe("extractor", () => {
  describe("#given a batch of mixed messages", () => {
    describe("#when extracting from a realistic conversation", () => {
      it("#then should only return accepted candidates", () => {
        const messages: ConversationMessage[] = [
          msg("user", "How does the auth system work?"),
          msg("assistant", "Let me analyze the auth system for you."),
          msg("user", "I prefer JWT tokens over session cookies"),
          msg("assistant", "The build failed because of a missing import"),
          msg("user", "Never use console.log in production code"),
          msg("user", "What time is it?"),
          msg("assistant", "I prefer to use async/await"),
          msg("user", "I decided to go with PostgreSQL because it has better JSON support"),
        ]

        const candidates = extractFromMessages(messages)

        const types = candidates.map((c) => c.type)
        expect(types).toContain("preference")
        expect(types).toContain("constraint")
        expect(types).toContain("failure")
        expect(types).toContain("decision")

        for (const c of candidates) {
          expect(c.confidence).toBeGreaterThanOrEqual(0.5)
          expect(c.sourceSessionId).toBe("ses_e2e")
          expect(c.sourceMessageId).toBeTruthy()
        }

        const assistantPref = candidates.find(
          (c) => c.type === "preference" && c.sourceRole === "assistant"
        )
        expect(assistantPref).toBeUndefined()
      })
    })
  })

  describe("#given an empty message batch", () => {
    describe("#when extracting", () => {
      it("#then should return empty array", () => {
        expect(extractFromMessages([])).toEqual([])
      })
    })
  })

  describe("#given explicit intent messages", () => {
    describe("#when user says remember", () => {
      it("#then should capture with explicitIntent flag", () => {
        const messages = [msg("user", "Remember this: I always prefer dark mode")]
        const candidates = extractFromMessages(messages)
        expect(candidates.length).toBe(1)
        expect(candidates[0].explicitIntent).toBe(true)
        expect(candidates[0].confidence).toBeGreaterThanOrEqual(0.85)
      })
    })
  })

  describe("#given buildCaptureMetadata", () => {
    describe("#when building metadata for a candidate", () => {
      it("#then should produce valid JSON with all required fields", () => {
        const candidates = extractFromMessages([
          msg("user", "I prefer vim over emacs", "msg_test123"),
        ])
        expect(candidates.length).toBe(1)

        const metadata = buildCaptureMetadata(candidates[0], { extractorVersion: "1.0.0" })
        const parsed = JSON.parse(metadata)

        expect(parsed.auto_extracted).toBe(true)
        expect(parsed.confidence).toBeGreaterThanOrEqual(0.5)
        expect(parsed.source_session).toBe("ses_e2e")
        expect(parsed.source_message_id).toBe("msg_test123")
        expect(parsed.source_role).toBe("user")
        expect(parsed.explicit_intent).toBe(false)
        expect(parsed.extractor_version).toBe("1.0.0")
      })
    })
  })
})
