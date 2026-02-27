import { describe, it, expect } from "bun:test"
import { classifyMessage } from "../src/classifier"
import type { ConversationMessage } from "../src/types"

function userMsg(content: string, id = "msg_1"): ConversationMessage {
  return { id, role: "user", content, sessionId: "ses_test" }
}

function assistantMsg(content: string, id = "msg_2"): ConversationMessage {
  return { id, role: "assistant", content, sessionId: "ses_test" }
}

describe("classifier", () => {
  describe("#given Layer 0 explicit intent bypass", () => {
    describe("#when user says 'remember this' with a preference", () => {
      it("#then should accept with high confidence and explicitIntent flag", () => {
        const result = classifyMessage(userMsg("Remember this: I prefer vim over emacs"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("preference")
        expect(result.confidence).toBeGreaterThanOrEqual(0.85)
        expect(result.explicitIntent).toBe(true)
      })
    })

    describe("#when user says 'keep in mind' with a constraint", () => {
      it("#then should accept despite question mark", () => {
        const result = classifyMessage(userMsg("Keep in mind: never use console.log in production, it must be removed"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("constraint")
        expect(result.explicitIntent).toBe(true)
      })
    })

    describe("#when user says 'for future reference' with a decision", () => {
      it("#then should bypass negative patterns", () => {
        const result = classifyMessage(userMsg("For future reference, I decided to use PostgreSQL"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("decision")
        expect(result.explicitIntent).toBe(true)
      })
    })

    describe("#when assistant says 'remember' with a preference", () => {
      it("#then should still respect role filter (deny assistant preference)", () => {
        const result = classifyMessage(assistantMsg("Remember that you prefer dark mode"))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("role_forbidden")
      })
    })
  })

  describe("#given Layer 1 negative pattern rejection", () => {
    describe("#when assistant provides analysis preamble", () => {
      it("#then should reject", () => {
        const result = classifyMessage(assistantMsg("Let me analyze what went wrong with the build"))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("negative_pattern")
      })
    })

    describe("#when user recalls past events", () => {
      it("#then should reject", () => {
        const result = classifyMessage(userMsg("I remember when we decided to use React"))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("negative_pattern")
      })
    })
  })

  describe("#given Layer 2 keyword scoring", () => {
    describe("#when user expresses a clear preference", () => {
      it("#then should accept with correct type", () => {
        const result = classifyMessage(userMsg("I prefer TypeScript over JavaScript"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("preference")
        expect(result.confidence).toBeGreaterThanOrEqual(0.5)
      })
    })

    describe("#when user reports a failure with cause", () => {
      it("#then should accept as failure", () => {
        const result = classifyMessage(userMsg("The deploy failed because of missing env vars"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("failure")
      })
    })

    describe("#when text has no signal keywords", () => {
      it("#then should reject with below_threshold", () => {
        const result = classifyMessage(userMsg("The weather is nice today"))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("below_threshold")
      })
    })
  })

  describe("#given Layer 3 role validation", () => {
    describe("#when assistant expresses a preference", () => {
      it("#then should reject with role_forbidden", () => {
        const result = classifyMessage(assistantMsg("I prefer to use async/await over callbacks"))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("role_forbidden")
      })
    })

    describe("#when assistant reports a failure", () => {
      it("#then should accept (failure allows both roles)", () => {
        const result = classifyMessage(assistantMsg("The test failed because of a race condition"))
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("failure")
      })
    })

    describe("#when assistant reports a failure with low confidence", () => {
      it("#then should reject if below assistant threshold", () => {
        // "failed" alone = 0.55, but assistant threshold is 0.6
        const result = classifyMessage(assistantMsg("The test failed"), {
          assistantThreshold: 0.6,
        })
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("below_threshold")
      })
    })

    describe("#when assistant reports failure with booster (above threshold)", () => {
      it("#then should accept", () => {
        // "failed" + "because" = 0.65, above 0.6 threshold
        const result = classifyMessage(
          assistantMsg("The build failed because of a type error"),
          { assistantThreshold: 0.6 }
        )
        expect(result.accepted).toBe(true)
        expect(result.type).toBe("failure")
      })
    })
  })

  describe("#given empty content", () => {
    describe("#when message content is empty", () => {
      it("#then should reject with empty_content", () => {
        const result = classifyMessage(userMsg(""))
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("empty_content")
      })
    })
  })

  describe("#given custom thresholds", () => {
    describe("#when confidence threshold is raised", () => {
      it("#then should reject messages that would normally pass", () => {
        // "I prefer X" = 0.55, normally passes 0.5 threshold
        const result = classifyMessage(userMsg("I prefer dark mode"), {
          confidenceThreshold: 0.6,
        })
        expect(result.accepted).toBe(false)
        expect(result.rejectionReason).toBe("below_threshold")
      })
    })
  })
})
