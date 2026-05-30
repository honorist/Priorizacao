import { describe, expect, it } from "vitest"
import { classify, maxScore, rankProjects, scoreProject, suggestBands } from "./scoring"
import { createSeedData } from "./seed"
import type { Project, Theme } from "./types"

function makeTheme(): Theme {
  return {
    id: "t",
    name: "Tema",
    color: "#000",
    criteria: [
      {
        id: "c1",
        name: "C1",
        weight: 2,
        options: [
          { id: "c1-A", label: "A", value: 1 },
          { id: "c1-B", label: "B", value: 10 },
        ],
      },
      {
        id: "c2",
        name: "C2",
        weight: 1,
        options: [
          { id: "c2-A", label: "A", value: 0 },
          { id: "c2-B", label: "B", value: 5 },
        ],
      },
    ],
    bands: [
      { id: "b1", label: "Baixa", min: 0, color: "#aaa" },
      { id: "b2", label: "Alta", min: 15, color: "#f00" },
    ],
  }
}

function makeProject(scores: Record<string, string>): Project {
  return {
    id: "p",
    name: "P",
    themeId: "t",
    scores,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  }
}

describe("maxScore", () => {
  it("soma o maior valor de cada critério vezes o peso", () => {
    // c1: max(1,10)=10 * 2 = 20 ; c2: max(0,5)=5 * 1 = 5 => 25
    expect(maxScore(makeTheme())).toBe(25)
  })
})

describe("scoreProject", () => {
  it("calcula nota bruta = Σ(valor × peso)", () => {
    const r = scoreProject(makeProject({ c1: "c1-B", c2: "c2-A" }), makeTheme())
    // c1: 10*2=20 ; c2: 0*1=0 => 20
    expect(r.raw).toBe(20)
    expect(r.max).toBe(25)
    expect(r.pct).toBeCloseTo(80)
    expect(r.complete).toBe(true)
    expect(r.answered).toBe(2)
  })

  it("aplica a ponderação (multiplicador) na nota final", () => {
    const p = { ...makeProject({ c1: "c1-B", c2: "c2-A" }), ponderacao: 1.2 }
    const r = scoreProject(p, makeTheme())
    // base = 10*2 = 20 ; raw = 20 * 1.2 = 24
    expect(r.base).toBe(20)
    expect(r.factor).toBe(1.2)
    expect(r.raw).toBeCloseTo(24)
  })

  it("ignora critérios não respondidos e marca como incompleto", () => {
    const r = scoreProject(makeProject({ c1: "c1-A" }), makeTheme())
    // c1: 1*2=2 ; c2 ausente => 2
    expect(r.raw).toBe(2)
    expect(r.complete).toBe(false)
    expect(r.answered).toBe(1)
    expect(r.total).toBe(2)
  })

  it("ignora opção inexistente (id inválido)", () => {
    const r = scoreProject(makeProject({ c1: "lixo" }), makeTheme())
    expect(r.raw).toBe(0)
    expect(r.answered).toBe(0)
  })

  it("não quebra com tema sem critérios", () => {
    const empty: Theme = { ...makeTheme(), criteria: [] }
    const r = scoreProject(makeProject({}), empty)
    expect(r.raw).toBe(0)
    expect(r.max).toBe(0)
    expect(r.pct).toBe(0)
    expect(r.complete).toBe(false)
  })
})

describe("classify", () => {
  it("escolhe a faixa de maior min que ainda seja <= nota", () => {
    const bands = makeTheme().bands
    expect(classify(20, bands)?.label).toBe("Alta")
    expect(classify(15, bands)?.label).toBe("Alta")
    expect(classify(14.99, bands)?.label).toBe("Baixa")
    expect(classify(0, bands)?.label).toBe("Baixa")
  })

  it("cai na faixa mais baixa quando a nota é menor que todos os limites", () => {
    const bands = [
      { id: "b1", label: "Média", min: 5, color: "#000" },
      { id: "b2", label: "Alta", min: 10, color: "#000" },
    ]
    expect(classify(2, bands)?.label).toBe("Média")
  })

  it("retorna undefined sem faixas", () => {
    expect(classify(10, [])).toBeUndefined()
  })
})

describe("rankProjects", () => {
  const theme = makeTheme()
  const high = { ...makeProject({ c1: "c1-B", c2: "c2-B" }), id: "high", name: "High" }
  const low = { ...makeProject({ c1: "c1-A", c2: "c2-A" }), id: "low", name: "Low" }

  it("ordena por percentual desc por padrão", () => {
    const ranked = rankProjects([low, high], [theme])
    expect(ranked.map((r) => r.project.id)).toEqual(["high", "low"])
    expect(ranked[0].band?.label).toBe("Alta")
  })

  it("filtra por tema", () => {
    const other = { ...low, id: "other", themeId: "outro" }
    const ranked = rankProjects([high, other], [theme], { themeId: "t" })
    expect(ranked).toHaveLength(1)
    expect(ranked[0].project.id).toBe("high")
  })

  it("ignora projeto cujo tema não existe", () => {
    const orphan = { ...low, id: "orphan", themeId: "fantasma" }
    expect(rankProjects([orphan], [theme])).toHaveLength(0)
  })
})

describe("suggestBands", () => {
  it("distribui os limites em frações iguais do máximo", () => {
    const bands = suggestBands(makeTheme()) // max=25, n=2 => 0, 12.5
    expect(bands.map((b) => b.min)).toEqual([0, 12.5])
  })
})

describe("seed", () => {
  const data = createSeedData()

  it("tem os 5 temas", () => {
    expect(data.themes).toHaveLength(5)
    expect(
      data.themes.some((t) => t.name.includes("Aumento de Capacidade")),
    ).toBe(true)
    expect(data.projects).toHaveLength(0)
  })

  it("cada critério tem 4 opções e pesos somam ~1 por tema", () => {
    for (const theme of data.themes) {
      const sum = theme.criteria.reduce((a, c) => a + c.weight, 0)
      expect(sum).toBeCloseTo(1, 5)
      for (const c of theme.criteria) {
        expect(c.options).toHaveLength(4)
      }
      expect(theme.bands).toHaveLength(3)
    }
  })

  it("ids de opções são únicos dentro do conjunto", () => {
    const ids = data.themes.flatMap((t) =>
      t.criteria.flatMap((c) => c.options.map((o) => o.id)),
    )
    expect(new Set(ids).size).toBe(ids.length)
  })
})
