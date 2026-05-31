import type { Band, Criterion, ID, Project, ScoreResult, Theme } from "./types"

/** Critérios aplicáveis a um projeto conforme o subtipo escolhido.
 *  Tema sem subtipos → todos os critérios. Com subtipos → os comuns
 *  (sem subtype) + os do subtipo selecionado. */
export function applicableCriteria(theme: Theme, subtype?: string): Criterion[] {
  if (!theme.subtypes || theme.subtypes.length === 0) return theme.criteria
  return theme.criteria.filter((c) => !c.subtype || c.subtype === subtype)
}

function maxOption(c: Criterion): number {
  return c.options.length ? Math.max(...c.options.map((o) => o.value)) : 0
}

/**
 * Nota máxima de um conjunto de critérios. Critérios de SOMA contribuem
 * Σ(maxValor × peso); critérios MULTIPLICADORES entram como produto dos maiores
 * valores. Resultado = (soma, ou 1 se não houver soma) × produto dos multiplicadores.
 */
function computeMax(criteria: Criterion[]): number {
  const sumC = criteria.filter((c) => !c.multiplier)
  const multC = criteria.filter((c) => c.multiplier)
  const sumMax = sumC.reduce((a, c) => a + maxOption(c) * c.weight, 0)
  if (multC.length === 0) return sumMax
  const multMax = multC.reduce((a, c) => a * (maxOption(c) || 1), 1)
  return (sumC.length ? sumMax : 1) * multMax
}

/** Nota máxima possível. Sem subtipo num tema com subtipos, usa o maior máximo
 *  entre os subtipos (base para as faixas, que são por tema). */
export function maxScore(theme: Theme, subtype?: string): number {
  if (subtype === undefined && theme.subtypes && theme.subtypes.length > 0) {
    return Math.max(
      0,
      ...theme.subtypes.map((st) => computeMax(applicableCriteria(theme, st))),
    )
  }
  return computeMax(applicableCriteria(theme, subtype))
}

/** Calcula a nota de um projeto contra os critérios aplicáveis (tema/subtipo).
 *  Critérios de soma: Σ(valor × peso). Critérios multiplicadores: produto dos
 *  valores. A ponderação (partes interessadas) multiplica a nota final. */
export function scoreProject(project: Project, theme: Theme): ScoreResult {
  const crit = applicableCriteria(theme, project.subtype)
  const total = crit.length
  let sumPart = 0
  let multPart = 1
  let answered = 0
  let multAnswered = 0
  const hasSum = crit.some((c) => !c.multiplier)

  for (const c of crit) {
    const selected = c.options.find((o) => o.id === project.scores[c.id])
    if (!selected) continue
    answered += 1
    if (c.multiplier) {
      multPart *= selected.value
      multAnswered += 1
    } else {
      sumPart += selected.value * c.weight
    }
  }

  const base = hasSum
    ? sumPart * (multAnswered > 0 ? multPart : 1)
    : multAnswered > 0
      ? multPart
      : 0

  const factor = project.ponderacao && project.ponderacao > 0 ? project.ponderacao : 1
  const raw = base * factor
  const max = computeMax(crit)
  const pct = max > 0 ? (raw / max) * 100 : 0
  return {
    base,
    factor,
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
