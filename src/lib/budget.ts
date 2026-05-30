import type { ID, Project, YearPlan } from "./types"

export interface PlanStats {
  budget: number
  /** Soma do CapEx dos projetos selecionados (US$). */
  total: number
  /** Orçamento - total (negativo = estourou). */
  remaining: number
  overBudget: boolean
  /** Quantos projetos selecionados. */
  count: number
  /** Quantos selecionados não têm CapEx informado. */
  missingCapex: number
}

/** Estatísticas de um plano anual contra a lista de projetos. */
export function planStats(plan: YearPlan, projects: Project[]): PlanStats {
  const byId = new Map(projects.map((p) => [p.id, p]))
  let total = 0
  let missingCapex = 0
  let count = 0
  for (const id of plan.selectedIds) {
    const p = byId.get(id)
    if (!p) continue
    count += 1
    if (p.capex && p.capex > 0) total += p.capex
    else missingCapex += 1
  }
  const budget = plan.budget || 0
  return {
    budget,
    total,
    remaining: budget - total,
    overBudget: total > budget,
    count,
    missingCapex,
  }
}

/**
 * Preenchimento guloso por prioridade: recebe os projetos JÁ na ordem do ranking
 * (maior nota primeiro) e inclui cada um enquanto couber no orçamento — pula o
 * que estouraria e continua tentando os próximos (mais baratos).
 */
export function autoFill(orderedProjects: Project[], budget: number): ID[] {
  const out: ID[] = []
  let total = 0
  for (const p of orderedProjects) {
    const capex = p.capex && p.capex > 0 ? p.capex : 0
    if (total + capex <= budget) {
      out.push(p.id)
      total += capex
    }
  }
  return out
}
