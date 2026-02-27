import { describe, it, expect } from "bun:test"
import { matchesNegativePattern } from "../src/negative-patterns"

describe("negative-patterns", () => {
  describe("#given AI meta-talk patterns", () => {
    describe("#when text starts with analysis preamble", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("Let me analyze your request", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("I'll examine the code", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("Here's a summary of the changes", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("Based on my analysis", "assistant").rejected).toBe(true)
      })
    })

    describe("#when text starts with structured output markers", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("Summary:", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("Goal:", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("Key findings:", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("| Column | Header |", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("## Section Header", "assistant").rejected).toBe(true)
      })
    })

    describe("#when text starts with step indicators", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("Step 1 install the package", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("First, let's set up the config", "assistant").rejected).toBe(true)
        expect(matchesNegativePattern("Next, we need to update the types", "assistant").rejected).toBe(true)
      })
    })
  })

  describe("#given first-person recall patterns", () => {
    describe("#when user recounts past events", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("I remember when we used Redux", "user").rejected).toBe(true)
        expect(matchesNegativePattern("As I recall the old system worked differently", "user").rejected).toBe(true)
        expect(matchesNegativePattern("Back when I used Angular, things were different", "user").rejected).toBe(true)
      })
    })
  })

  describe("#given remind-me patterns", () => {
    describe("#when user asks to be reminded", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("Remind me to update the tests later", "user").rejected).toBe(true)
        expect(matchesNegativePattern("Can you remind me about the deployment steps?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("Don't let me forget to commit", "user").rejected).toBe(true)
      })
    })
  })

  describe("#given assistant list patterns", () => {
    describe("#when assistant generates a numbered list", () => {
      it("#then should reject for assistant role", () => {
        const list = "Here are the options:\n1. Option A\n2. Option B\n3. Option C\n4. Option D"
        expect(matchesNegativePattern(list, "assistant").rejected).toBe(true)
      })

      it("#then should NOT reject for user role", () => {
        const list = "1. Option A\n2. Option B\n3. Option C\n4. Option D"
        expect(matchesNegativePattern(list, "user").rejected).toBe(false)
      })
    })
  })

  describe("#given question-only patterns", () => {
    describe("#when text is a pure question", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("How does the auth system work?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("What is the best approach?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("Can you explain this?", "user").rejected).toBe(true)
      })
    })
  })

  describe("#given valid preference statements", () => {
    describe("#when user states a preference", () => {
      it("#then should NOT reject", () => {
        expect(matchesNegativePattern("I prefer dark mode over light mode", "user").rejected).toBe(false)
        expect(matchesNegativePattern("Never use tabs, always use spaces", "user").rejected).toBe(false)
        expect(matchesNegativePattern("I decided to use PostgreSQL", "user").rejected).toBe(false)
      })
    })

    describe("#when user states preference with negation", () => {
      it("#then should NOT reject (negation is valid)", () => {
        expect(matchesNegativePattern("I don't want to use var", "user").rejected).toBe(false)
        expect(matchesNegativePattern("Don't use console.log in production", "user").rejected).toBe(false)
      })
    })
  })

  describe("#given empty content", () => {
    describe("#when text is empty", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("", "user").rejected).toBe(true)
        expect(matchesNegativePattern("   ", "user").rejected).toBe(true)
      })
    })
  })
})
