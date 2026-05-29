import { Plus, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { maxScore } from "@/lib/scoring"
import { fmtNum } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { Theme } from "@/lib/types"

export function BandEditor({ theme }: { theme: Theme }) {
  const addBand = useAppStore((s) => s.addBand)
  const updateBand = useAppStore((s) => s.updateBand)
  const removeBand = useAppStore((s) => s.removeBand)
  const autoBands = useAppStore((s) => s.autoBands)
  const max = maxScore(theme)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Nota máxima do tema:{" "}
          <strong className="text-foreground tabular-nums">{fmtNum(max)}</strong>
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => autoBands(theme.id)}>
            <Sparkles className="size-3.5" /> Sugerir limites
          </Button>
          <Button size="sm" variant="outline" onClick={() => addBand(theme.id)}>
            <Plus className="size-3.5" /> Faixa
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {[...theme.bands]
          .sort((a, b) => a.min - b.min)
          .map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-[1fr_7rem_3.5rem_auto] items-end gap-2"
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Rótulo</Label>
                <Input
                  value={b.label}
                  onChange={(e) =>
                    updateBand(theme.id, b.id, { label: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nota mínima</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={b.min}
                  onChange={(e) =>
                    updateBand(theme.id, b.id, { min: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cor</Label>
                <Input
                  type="color"
                  className="h-9 p-1"
                  value={b.color}
                  onChange={(e) =>
                    updateBand(theme.id, b.id, { color: e.target.value })
                  }
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeBand(theme.id, b.id)}
                aria-label="Excluir faixa"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
}
