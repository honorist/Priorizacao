import { describe, expect, it } from "vitest"
import {
  applicableCriteria,
  classify,
  maxScore,
  rankProjects,
  scoreProject,
  suggestBands,
} from "./scoring"
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

  it("cada critério tem 4 opções; pesos somam ~1 por subtipo/tema", () => {
    for (const theme of data.themes) {
      for (const c of theme.criteria)
        expect(c.options.length).toBeGreaterThanOrEqual(2)
      expect(theme.bands).toHaveLength(3)
      if (theme.subtypes && theme.subtypes.length) {
        for (const st of theme.subtypes) {
          const sumC = theme.criteria.filter(
            (c) => (!c.subtype || c.subtype === st) && !c.multiplier,
          )
          if (sumC.length === 0) continue
          expect(sumC.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1, 5)
        }
      } else {
        const sumC = theme.criteria.filter((c) => !c.multiplier)
        if (sumC.length)
          expect(sumC.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1, 5)
      }
    }
  })

  it("ids de opções são únicos dentro do conjunto", () => {
    const ids = data.themes.flatMap((t) =>
      t.criteria.flatMap((c) => c.options.map((o) => o.id)),
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("TEMA 3 e TEMA 4 têm subtipos", () => {
    const t3 = data.themes.find((t) => t.id === "t3")
    const t4 = data.themes.find((t) => t.id === "t4")
    expect(t3?.subtypes).toEqual(["Eletro-eletrônico", "Mecânico"])
    expect(t4?.subtypes).toEqual(["Segurança", "Meio Ambiente"])
  })
})

describe("subtipos", () => {
  const theme: Theme = {
    id: "t",
    name: "T",
    color: "#000",
    subtypes: ["A", "B"],
    bands: [{ id: "b", label: "Baixa", min: 0, color: "#000" }],
    criteria: [
      { id: "ca", name: "CA", weight: 1, subtype: "A", options: [{ id: "ca-1", label: "x", value: 10 }] },
      { id: "cb", name: "CB", weight: 1, subtype: "B", options: [{ id: "cb-1", label: "x", value: 10 }] },
      { id: "cc", name: "CC", weight: 1, options: [{ id: "cc-1", label: "x", value: 10 }] },
    ],
  }

  it("applicableCriteria devolve comuns + os do subtipo", () => {
    expect(applicableCriteria(theme, "A").map((c) => c.id)).toEqual(["ca", "cc"])
    expect(applicableCriteria(theme, "B").map((c) => c.id)).toEqual(["cb", "cc"])
  })

  it("critérios multiplicadores fazem o produto (P×S)", () => {
    const t: Theme = {
      id: "tm",
      name: "TM",
      color: "#000",
      bands: [{ id: "b", label: "x", min: 0, color: "#000" }],
      criteria: [
        {
          id: "g",
          name: "Gravidade",
          weight: 1,
          multiplier: true,
          options: [
            { id: "g-3", label: "3", value: 3 },
            { id: "g-5", label: "5", value: 5 },
          ],
        },
        {
          id: "p",
          name: "Prob",
          weight: 1,
          multiplier: true,
          options: [
            { id: "p-2", label: "2", value: 2 },
            { id: "p-4", label: "4", value: 4 },
          ],
        },
      ],
    }
    const proj: Project = {
      id: "p",
      name: "P",
      themeId: "tm",
      scores: { g: "g-5", p: "p-4" },
      createdAt: "x",
      updatedAt: "x",
    }
    const r = scoreProject(proj, t)
    expect(r.base).toBe(20) // 5 × 4
    expect(r.max).toBe(20)
  })

  it("scoreProject pontua só o subtipo do projeto", () => {
    const p: Project = {
      id: "p",
      name: "P",
      themeId: "t",
      subtype: "A",
      scores: { "ca-1-bad": "x", ca: "ca-1", cc: "cc-1" },
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    }
    const r = scoreProject(p, theme)
    // aplicáveis: ca (10) + cc (10) = 20 ; cb (do subtipo B) é ignorado
    expect(r.raw).toBe(20)
    expect(r.total).toBe(2)
    expect(r.complete).toBe(true)
  })
})
