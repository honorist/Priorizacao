import { describe, expect, it } from "vitest"
import { autoFill, planStats } from "./budget"
import type { Project, YearPlan } from "./types"

function proj(id: string, capex?: number): Project {
  return {
    id,
    name: id,
    themeId: "t",
    capex,
    scores: {},
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }
}

const projects = [
  proj("a", 100),
  proj("b", 250),
  proj("c", 50),
  proj("d"), // sem capex
]

describe("planStats", () => {
  it("soma o CapEx dos selecionados e calcula saldo", () => {
    const plan: YearPlan = { id: "p", year: 2026, budget: 400, selectedIds: ["a", "b"] }
    const s = planStats(plan, projects)
    expect(s.total).toBe(350)
    expect(s.remaining).toBe(50)
    expect(s.overBudget).toBe(false)
    expect(s.count).toBe(2)
    expect(s.missingCapex).toBe(0)
  })

  it("marca estouro quando passa do orçamento", () => {
    const plan: YearPlan = { id: "p", year: 2026, budget: 300, selectedIds: ["a", "b"] }
    const s = planStats(plan, projects)
    expect(s.total).toBe(350)
    expect(s.remaining).toBe(-50)
    expect(s.overBudget).toBe(true)
  })

  it("conta selecionados sem CapEx e ignora ids inexistentes", () => {
    const plan: YearPlan = {
      id: "p",
      year: 2026,
      budget: 1000,
      selectedIds: ["a", "d", "fantasma"],
    }
    const s = planStats(plan, projects)
    expect(s.total).toBe(100)
    expect(s.count).toBe(2) // a + d (fantasma ignorado)
    expect(s.missingCapex).toBe(1)
  })
})

describe("autoFill", () => {
  it("inclui na ordem dada enquanto couber e pula o que estoura", () => {
    // ordem: a(100), b(250), c(50). Orçamento 200 => a(100) cabe, b(250) estoura (pula),
    // c(50) cabe (total 150).
    const ids = autoFill([projects[0], projects[1], projects[2]], 200)
    expect(ids).toEqual(["a", "c"])
  })

  it("inclui projetos sem CapEx (custo 0)", () => {
    const ids = autoFill([projects[3], projects[0]], 100)
    expect(ids).toEqual(["d", "a"])
  })

  it("retorna vazio com orçamento 0 e projetos com custo", () => {
    expect(autoFill([projects[0], projects[1]], 0)).toEqual([])
  })
})
