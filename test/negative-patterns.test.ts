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

  describe("#given system injection patterns", () => {
    describe("#when text contains bootstrap injection", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("[SESSION BOOTSTRAP - Nous Persistent Memory] Version: nous-omc...", "user").rejected).toBe(true)
        expect(matchesNegativePattern("## Memory Database\n## Constraints\n- [2] NEVER post on GitHub", "user").rejected).toBe(true)
        expect(matchesNegativePattern("## Constraints\n- never do this\n- always do that", "user").rejected).toBe(true)
      })
    })

    describe("#when text contains system reminder", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern('<system-reminder> [BACKGROUND TASK COMPLETED] **ID:** `bg_abc`</system-reminder>', "user").rejected).toBe(true)
        expect(matchesNegativePattern('<system-reminder>\nSome notification\n</system-reminder>', "user").rejected).toBe(true)
      })
    })

    describe("#when text contains delegation prompt markers", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern('1. TASK: Check upstream repos\n2. EXPECTED OUTCOME: Summary <!-- OMO_INTERNAL_INITIATOR -->', "user").rejected).toBe(true)
        expect(matchesNegativePattern('MUST NOT DO:\n- Do NOT post comments', "user").rejected).toBe(true)
        expect(matchesNegativePattern('REQUIRED TOOLS: Bash (for gh commands)', "user").rejected).toBe(true)
        expect(matchesNegativePattern('brain/omo-memory capture --type decision', "user").rejected).toBe(true)
      })
    })

    describe("#when text contains agent usage reminder", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern('[Agent Usage Reminder]\nYou called a search tool...', "user").rejected).toBe(true)
        expect(matchesNegativePattern('Instructions from: /workspace/nous-omc/AGENTS.md', "user").rejected).toBe(true)
      })
    })
  })

  describe("#given message length guard", () => {
    describe("#when text exceeds 1500 characters", () => {
      it("#then should reject as too long", () => {
        const longText = "I prefer ".repeat(200) // 1800 chars
        const result = matchesNegativePattern(longText, "user")
        expect(result.rejected).toBe(true)
        expect(result.pattern).toBe("too_long")
      })
    })

    describe("#when text is under 1500 characters", () => {
      it("#then should NOT reject on length alone", () => {
        const shortText = "I prefer dark mode over light mode"
        expect(matchesNegativePattern(shortText, "user").rejected).toBe(false)
      })
    })
  })

  describe("#given contraction question patterns", () => {
    describe("#when text is a question starting with contraction", () => {
      it("#then should reject", () => {
        expect(matchesNegativePattern("don't we already have some of this skills?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("doesn't this already exist?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("isn't that redundant?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("won't that break the build?", "user").rejected).toBe(true)
        expect(matchesNegativePattern("haven't we done this before?", "user").rejected).toBe(true)
      })
    })

    describe("#when text is a preference statement with contraction", () => {
      it("#then should NOT reject (not a question)", () => {
        expect(matchesNegativePattern("don't use console.log in production", "user").rejected).toBe(false)
        expect(matchesNegativePattern("doesn't matter which one, I prefer TypeScript", "user").rejected).toBe(false)
      })
    })
  })
})
