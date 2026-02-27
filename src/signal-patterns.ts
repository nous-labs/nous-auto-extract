/**
 * Keyword-based signal scoring — Layer 2 of the extraction pipeline.
 *
 * 5 categories with primary keywords (high signal) and booster keywords (context amplifiers).
 * Score = min(1.0, 0.3 + primary_matches * 0.25 + booster_matches * 0.10)
 */
import type { CategoryScore, MemoryType } from "./types"

interface CategoryDef {
  type: MemoryType
  primary: string[]
  boosters: string[]
}

const CATEGORIES: CategoryDef[] = [
  {
    type: "decision",
    primary: ["decided", "chose", "went with", "opted", "going with", "settled on", "picked"],
    boosters: ["because", "since", "reason", "after considering", "tradeoff"],
  },
  {
    type: "preference",
    primary: ["prefer", "like", "want", "rather", "always use", "my preference", "i usually"],
    boosters: ["instead", "over", "better", "rather than", "compared to"],
  },
  {
    type: "constraint",
    primary: ["never", "always", "must", "don't", "require", "mandatory", "forbidden", "do not"],
    boosters: ["important", "critical", "absolutely", "under no circumstances", "non-negotiable"],
  },
  {
    type: "failure",
    primary: ["broke", "failed", "wrong", "regression", "bug", "crashed", "error"],
    boosters: ["because", "root cause", "fix", "caused by", "turned out"],
  },
  {
    type: "learning",
    primary: ["learned", "discovered", "realized", "found out", "turns out", "figured out", "noticed"],
    boosters: ["today", "just", "finally", "after", "key insight"],
  },
]

/**
 * Score a text against all categories, returning the highest-scoring match.
 * Returns null if no primary keyword matches (score stays at base 0.3).
 */
export function scoreText(text: string): CategoryScore | null {
  const lower = text.toLowerCase()
  let best: CategoryScore | null = null

  for (const cat of CATEGORIES) {
    const primaryMatches = cat.primary.filter((kw) => lower.includes(kw))
    if (primaryMatches.length === 0) continue

    const boosterMatches = cat.boosters.filter((kw) => lower.includes(kw))
    const score = Math.min(1.0, 0.3 + primaryMatches.length * 0.25 + boosterMatches.length * 0.1)

    if (best === null || score > best.score) {
      best = {
        type: cat.type,
        score,
        primaryMatches,
        boosterMatches,
      }
    }
  }

  return best
}

/**
 * Score text against all categories, returning all matches sorted by score descending.
 * Useful for debugging — see all category activations.
 */
export function scoreAllCategories(text: string): CategoryScore[] {
  const lower = text.toLowerCase()
  const results: CategoryScore[] = []

  for (const cat of CATEGORIES) {
    const primaryMatches = cat.primary.filter((kw) => lower.includes(kw))
    if (primaryMatches.length === 0) continue

    const boosterMatches = cat.boosters.filter((kw) => lower.includes(kw))
    const score = Math.min(1.0, 0.3 + primaryMatches.length * 0.25 + boosterMatches.length * 0.1)

    results.push({ type: cat.type, score, primaryMatches, boosterMatches })
  }

  return results.sort((a, b) => b.score - a.score)
}
