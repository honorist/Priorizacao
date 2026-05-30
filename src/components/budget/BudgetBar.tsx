import { TriangleAlert } from "lucide-react"
import { planStats } from "@/lib/budget"
import { fmtCapex } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Project, YearPlan } from "@/lib/types"

/** Resumo do plano ativo: orçamento, selecionado, saldo, contagem e barra. */
export function BudgetBar({
  plan,
  projects,
}: {
  plan: YearPlan
  projects: Project[]
}) {
  const s = planStats(plan, projects)
  const pct = s.budget > 0 ? Math.min(100, (s.total / s.budget) * 100) : 0

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span>
            Ano <b className="tabular-nums">{plan.year}</b>
          </span>
          <span className="text-muted-foreground">
            Orçamento{" "}
            <b className="text-foreground tabular-nums">{fmtCapex(s.budget)}</b>
          </span>
          <span className="text-muted-foreground">
            Selecionado{" "}
            <b className="text-foreground tabular-nums">{fmtCapex(s.total)}</b>
          </span>
          <span className="text-muted-foreground">
            Saldo{" "}
            <b
              className={cn(
                "tabular-nums",
                s.overBudget ? "text-destructive" : "text-foreground",
              )}
            >
              {fmtCapex(s.remaining)}
            </b>
          </span>
          <span className="text-muted-foreground tabular-nums">
            {s.count} projeto(s)
          </span>
        </div>
        {s.overBudget && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <TriangleAlert className="size-3.5" /> Estourou o orçamento
          </span>
        )}
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            s.overBudget ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${s.overBudget ? 100 : pct}%` }}
        />
      </div>

      {s.missingCapex > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          {s.missingCapex} selecionado(s) sem CapEx informado (contam como US$ 0).
        </p>
      )}
    </div>
  )
}
