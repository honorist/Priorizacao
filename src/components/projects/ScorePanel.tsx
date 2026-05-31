import { Paperclip, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Attachment, Criterion, ID } from "@/lib/types"

interface ScorePanelProps {
  criteria: Criterion[]
  scores: Record<ID, ID>
  justifications?: Record<ID, string>
  validations?: Record<ID, string>
  attachments?: Record<ID, Attachment[]>
  onChange: (criterionId: ID, optionId: ID | null) => void
  onText: (
    criterionId: ID,
    kind: "justification" | "validation",
    value: string,
  ) => void
  onAddAttachment: (criterionId: ID, file: File) => void
  onRemoveAttachment: (criterionId: ID, attId: ID) => void
}

/** Painel de pontuação: critérios agrupados por seção (ex.: Probabilidade /
 *  Impacto, como na matriz CMPC). Para cada critério, escolha A/B/C/D +
 *  justificativa e anexos. */
export function ScorePanel({
  criteria,
  scores,
  justifications = {},
  attachments = {},
  onChange,
  onText,
  onAddAttachment,
  onRemoveAttachment,
}: ScorePanelProps) {
  if (criteria.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum critério aplicável. Escolha a característica principal (subtipo) ou
        adicione critérios na aba <strong>Temas</strong>.
      </p>
    )
  }

  // agrupa por seção, preservando a ordem de aparição
  const groups: { name: string; items: Criterion[] }[] = []
  for (const c of criteria) {
    const name = c.group ?? ""
    let g = groups.find((x) => x.name === name)
    if (!g) {
      g = { name, items: [] }
      groups.push(g)
    }
    g.items.push(c)
  }

  function card(c: Criterion) {
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
            {c.multiplier ? "× multiplicador" : `peso ${fmtNum(c.weight)}`}
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
        <div className="mt-2">
          <Textarea
            className="text-xs"
            rows={2}
            placeholder="Justificativa"
            value={justifications[c.id] ?? ""}
            onChange={(e) => onText(c.id, "justification", e.target.value)}
            aria-label={`Justificativa — ${c.name}`}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent">
            <Paperclip className="size-3.5" /> Anexar
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onAddAttachment(c.id, f)
                e.target.value = ""
              }}
            />
          </label>
          {(attachments[c.id] ?? []).map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              <a
                href={a.dataUrl}
                download={a.name}
                className="max-w-40 truncate underline"
                title={a.name}
              >
                {a.name}
              </a>
              <button
                type="button"
                onClick={() => onRemoveAttachment(c.id, a.id)}
                aria-label="Remover anexo"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.name || "_"} className="space-y-2">
          {g.name && (
            <div className="border-b pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {g.name}
            </div>
          )}
          {g.items.map((c) => card(c))}
        </div>
      ))}
    </div>
  )
}
