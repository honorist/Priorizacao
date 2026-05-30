import { describe, expect, it } from "vitest"
import { generateSampleProjects } from "./sample"
import { createSeedData } from "./seed"

describe("generateSampleProjects", () => {
  const { themes } = createSeedData()

  it("gera a quantidade pedida, com tema e notas válidas", () => {
    const projs = generateSampleProjects(themes, 50)
    expect(projs).toHaveLength(50)
    const themeIds = new Set(themes.map((t) => t.id))
    for (const p of projs) {
      expect(themeIds.has(p.themeId)).toBe(true)
      const theme = themes.find((t) => t.id === p.themeId)!
      for (const [cid, oid] of Object.entries(p.scores)) {
        const crit = theme.criteria.find((c) => c.id === cid)
        expect(crit).toBeTruthy()
        expect(crit!.options.some((o) => o.id === oid)).toBe(true)
      }
      expect(p.name).toContain("—")
      expect(p.capex ?? 0).toBeGreaterThan(0)
    }
  })

  it("retorna vazio quando não há temas", () => {
    expect(generateSampleProjects([], 10)).toHaveLength(0)
  })
})
