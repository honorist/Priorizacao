import type { Band, ID, Project, ScoreResult, Theme } from "./types"

/** Nota máxima possível de um tema = Σ(maior valor de opção × peso). */
export function maxScore(theme: Theme): number {
  return theme.criteria.reduce((acc, c) => {
    const maxOption = c.options.length
      ? Math.max(...c.options.map((o) => o.value))
      : 0
    return acc + maxOption * c.weight
  }, 0)
}

/** Calcula a nota de um projeto contra os critérios do seu tema. */
export function scoreProject(project: Project, theme: Theme): ScoreResult {
  let raw = 0
  let answered = 0
  const total = theme.criteria.length

  for (const c of theme.criteria) {
    const selectedId = project.scores[c.id]
    const selected = c.options.find((o) => o.id === selectedId)
    if (selected) {
      raw += selected.value * c.weight
      answered += 1
    }
  }

  const max = maxScore(theme)
  const pct = max > 0 ? (raw / max) * 100 : 0
  return {
    raw,
    max,
    pct,
    complete: total > 0 && answered === total,
    answered,
    total,
  }
}

/**
 * Classifica uma nota bruta numa faixa. Escolhe a faixa de maior `min` que ainda
 * seja <= nota. Se a nota for menor que todos os limites, cai na faixa mais baixa.
 */
export function classify(raw: number, bands: Band[]): Band | undefined {
  if (!bands.length) return undefined
  const sorted = [...bands].sort((a, b) => a.min - b.min)
  let match: Band = sorted[0]
  for (const b of sorted) {
    if (raw >= b.min) match = b
  }
  return match
}

export interface RankedProject {
  project: Project
  theme: Theme
  result: ScoreResult
  band?: Band
}

/**
 * Rankeia projetos. Por padrão ordena por percentual (justo entre temas com
 * máximos diferentes); use `by: "raw"` para ordenar pela nota bruta.
 */
export function rankProjects(
  projects: Project[],
  themes: Theme[],
  opts: { themeId?: ID; by?: "raw" | "pct" } = {},
): RankedProject[] {
  const { themeId, by = "pct" } = opts
  const themeMap = new Map(themes.map((t) => [t.id, t]))
  const rows: RankedProject[] = []

  for (const p of projects) {
    if (themeId && p.themeId !== themeId) continue
    const theme = themeMap.get(p.themeId)
    if (!theme) continue
    const result = scoreProject(p, theme)
    rows.push({ project: p, theme, result, band: classify(result.raw, theme.bands) })
  }

  rows.sort((a, b) =>
    by === "raw" ? b.result.raw - a.result.raw : b.result.pct - a.result.pct,
  )
  return rows
}

/**
 * Sugere limites de faixa distribuídos uniformemente sobre a nota máxima do tema
 * (0, max/n, 2·max/n, ...). Mantém rótulos/cores/ids das faixas existentes.
 */
export function suggestBands(theme: Theme): Band[] {
  const max = maxScore(theme)
  const sorted = [...theme.bands].sort((a, b) => a.min - b.min)
  const n = sorted.length || 1
  return sorted.map((b, i) => ({
    ...b,
    min: Math.round(((max * i) / n) * 100) / 100,
  }))
}
