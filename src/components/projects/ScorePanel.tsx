import { fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ID, Theme } from "@/lib/types"

interface ScorePanelProps {
  theme: Theme
  scores: Record<ID, ID>
  onChange: (criterionId: ID, optionId: ID | null) => void
}

/** Painel de pontuação: para cada critério do tema, escolha uma opção (A/B/C/D). */
export function ScorePanel({ theme, scores, onChange }: ScorePanelProps) {
  if (theme.criteria.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este tema ainda não tem critérios. Adicione critérios na aba{" "}
        <strong>Temas</strong>.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {theme.criteria.map((c) => {
        const selected = scores[c.id]
        return (
          <div key={c.id} className="rounded-lg border p-3">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-sm font-medium">{c.name}</span>
                {c.description && (
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                peso {fmtNum(c.weight)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {c.options.map((o) => {
                const isSel = selected === o.id
                return (
                  <button
                    type="button"
                    key={o.id}
                    aria-pressed={isSel}
                    onClick={() => onChange(c.id, isSel ? null : o.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-md border p-2 text-left text-xs transition-colors hover:bg-accent",
                      isSel
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-input",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-semibold">{o.label}</span>
                      <span className="text-muted-foreground">{fmtNum(o.value)}</span>
                    </div>
                    {o.description && (
                      <span className="leading-tight text-muted-foreground">
                        {o.description}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
