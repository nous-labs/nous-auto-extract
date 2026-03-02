import { describe, it, expect } from "bun:test"
import { scoreText, scoreAllCategories } from "../src/signal-patterns"

describe("signal-patterns", () => {
  describe("#given preference keywords", () => {
    describe("#when scoring text with a single primary keyword", () => {
      it("#then should return preference type with base + 1 primary score", () => {
        const result = scoreText("I prefer dark mode")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("preference")
        expect(result!.score).toBe(0.55) // 0.3 + 1*0.25
        expect(result!.primaryMatches).toContain("prefer")
      })
    })

    describe("#when scoring text with primary + booster keywords", () => {
      it("#then should return higher score", () => {
        const result = scoreText("I prefer tabs over spaces")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("preference")
        expect(result!.score).toBe(0.65) // 0.3 + 1*0.25 + 1*0.10
        expect(result!.boosterMatches).toContain("over")
      })
    })

    describe("#when scoring text with multiple primary keywords", () => {
      it("#then should sum primary contributions", () => {
        const result = scoreText("I always use and prefer vim")
        expect(result).not.toBeNull()
        expect(result!.score).toBeGreaterThanOrEqual(0.8) // 0.3 + 2*0.25 = 0.8
      })
    })
  })

  describe("#given decision keywords", () => {
    describe("#when scoring a decision statement", () => {
      it("#then should return decision type", () => {
        const result = scoreText("I decided to use PostgreSQL because it has better JSON support")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("decision")
        expect(result!.primaryMatches).toContain("decided")
        expect(result!.boosterMatches).toContain("because")
      })
    })
  })

  describe("#given constraint keywords", () => {
    describe("#when scoring a constraint with negation", () => {
      it("#then should detect constraint type", () => {
        const result = scoreText("Never use var in JavaScript, always use const or let")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("constraint")
        expect(result!.primaryMatches).toContain("never")
        expect(result!.primaryMatches).toContain("always")
      })
    })
  })

  describe("#given failure keywords", () => {
    describe("#when scoring a failure report", () => {
      it("#then should detect failure type with boosters", () => {
        const result = scoreText("The build failed because of a missing dependency")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("failure")
        expect(result!.primaryMatches).toContain("failed")
        expect(result!.boosterMatches).toContain("because")
      })
    })
  })

  describe("#given learning keywords", () => {
    describe("#when scoring a learning statement", () => {
      it("#then should detect learning type", () => {
        const result = scoreText("I just discovered that bun is much faster for this")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("learning")
        expect(result!.primaryMatches).toContain("discovered")
        expect(result!.boosterMatches).toContain("just")
      })
    })
  })

  describe("#given no matching keywords", () => {
    describe("#when scoring generic text", () => {
      it("#then should return null", () => {
        const result = scoreText("The weather is nice today")
        expect(result).toBeNull()
      })
    })

    describe("#when scoring an empty string", () => {
      it("#then should return null", () => {
        const result = scoreText("")
        expect(result).toBeNull()
      })
    })
  })

  describe("#given competing categories", () => {
    describe("#when text matches multiple categories", () => {
      it("#then should return the highest scoring one", () => {
        const all = scoreAllCategories("I decided to always use TypeScript because it's better")
        expect(all.length).toBeGreaterThan(1)
        // highest score wins
        expect(all[0].score).toBeGreaterThanOrEqual(all[1].score)
      })
    })
  })

  describe("#given score capping", () => {
    describe("#when many keywords match", () => {
      it("#then should cap at 1.0", () => {
        const result = scoreText("I always prefer and want and i like X over Y instead of Z, better than W")
        expect(result).not.toBeNull()
        expect(result!.score).toBeLessThanOrEqual(1.0)
      })
    })
  })

  describe("#given refined 'like' keyword", () => {
    describe("#when text contains 'i like' as preference", () => {
      it("#then should match preference", () => {
        const result = scoreText("I like TypeScript for backend work")
        expect(result).not.toBeNull()
        expect(result!.type).toBe("preference")
        expect(result!.primaryMatches).toContain("i like")
      })
    })

    describe("#when text contains 'like' in non-preference context", () => {
      it("#then should NOT match preference for 'like'", () => {
        const result = scoreText("burning like hell")
        // Should not match preference — no 'i like' present
        expect(result).toBeNull()
      })

      it("#then should NOT match for 'looks like'", () => {
        const result = scoreText("looks like it works fine")
        expect(result).toBeNull()
      })

      it("#then should NOT match for 'feels like'", () => {
        const result = scoreText("feels like the wrong approach")
        // 'wrong' matches failure, but 'like' alone won't match preference
        expect(result).not.toBeNull()
        expect(result!.type).toBe("failure")
      })
    })
  })
})
