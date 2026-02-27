import { describe, it, expect } from "bun:test"
import { isRoleAllowed, requiresHigherAssistantThreshold } from "../src/role-filter"

describe("role-filter", () => {
  describe("#given human-only types", () => {
    describe("#when checking preference from user", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("preference", "user")).toBe(true)
      })
    })

    describe("#when checking preference from assistant", () => {
      it("#then should deny", () => {
        expect(isRoleAllowed("preference", "assistant")).toBe(false)
      })
    })

    describe("#when checking constraint from user", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("constraint", "user")).toBe(true)
      })
    })

    describe("#when checking constraint from assistant", () => {
      it("#then should deny", () => {
        expect(isRoleAllowed("constraint", "assistant")).toBe(false)
      })
    })

    describe("#when checking decision from user", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("decision", "user")).toBe(true)
      })
    })

    describe("#when checking decision from assistant", () => {
      it("#then should deny", () => {
        expect(isRoleAllowed("decision", "assistant")).toBe(false)
      })
    })
  })

  describe("#given both-role types", () => {
    describe("#when checking failure from user", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("failure", "user")).toBe(true)
      })
    })

    describe("#when checking failure from assistant", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("failure", "assistant")).toBe(true)
      })
    })

    describe("#when checking learning from user", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("learning", "user")).toBe(true)
      })
    })

    describe("#when checking learning from assistant", () => {
      it("#then should allow", () => {
        expect(isRoleAllowed("learning", "assistant")).toBe(true)
      })
    })
  })

  describe("#given assistant threshold requirement", () => {
    describe("#when failure from assistant", () => {
      it("#then should require higher threshold", () => {
        expect(requiresHigherAssistantThreshold("failure", "assistant")).toBe(true)
      })
    })

    describe("#when failure from user", () => {
      it("#then should NOT require higher threshold", () => {
        expect(requiresHigherAssistantThreshold("failure", "user")).toBe(false)
      })
    })

    describe("#when preference from user", () => {
      it("#then should NOT require higher threshold", () => {
        expect(requiresHigherAssistantThreshold("preference", "user")).toBe(false)
      })
    })
  })
})
