import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/store/useAppStore"
import type { Criterion, Theme } from "@/lib/types"

interface CriterionEditorProps {
  theme: Theme
  criterion: Criterion
  index: number
  count: number
}

export function CriterionEditor({
  theme,
  criterion,
  index,
  count,
}: CriterionEditorProps) {
  const updateCriterion = useAppStore((s) => s.updateCriterion)
  const removeCriterion = useAppStore((s) => s.removeCriterion)
  const moveCriterion = useAppStore((s) => s.moveCriterion)
  const addOption = useAppStore((s) => s.addOption)
  const updateOption = useAppStore((s) => s.updateOption)
  const removeOption = useAppStore((s) => s.removeOption)

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_6rem]">
          <div className="space-y-1.5">
            <Label className="text-xs">Critério</Label>
            <Input
              value={criterion.name}
              onChange={(e) =>
                updateCriterion(theme.id, criterion.id, { name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Peso</Label>
            <Input
              type="number"
              step="0.05"
              value={criterion.weight}
              onChange={(e) =>
                updateCriterion(theme.id, criterion.id, {
                  weight: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={criterion.description ?? ""}
              onChange={(e) =>
                updateCriterion(theme.id, criterion.id, {
                  description: e.target.value,
                })
              }
              placeholder="O que esse critério avalia"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={index === 0}
            onClick={() => moveCriterion(theme.id, criterion.id, -1)}
            aria-label="Mover para cima"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={index === count - 1}
            onClick={() => moveCriterion(theme.id, criterion.id, 1)}
            aria-label="Mover para baixo"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={() => removeCriterion(theme.id, criterion.id)}
            aria-label="Excluir critério"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase">
            Opções (rótulo · valor · descrição)
          </Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addOption(theme.id, criterion.id)}
          >
            <Plus className="size-3.5" /> Opção
          </Button>
        </div>
        <div className="space-y-1.5">
          {criterion.options.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-[3rem_4.5rem_1fr_auto] items-center gap-2"
            >
              <Input
                value={o.label}
                onChange={(e) =>
                  updateOption(theme.id, criterion.id, o.id, {
                    label: e.target.value,
                  })
                }
                aria-label="Rótulo da opção"
              />
              <Input
                type="number"
                value={o.value}
                onChange={(e) =>
                  updateOption(theme.id, criterion.id, o.id, {
                    value: Number(e.target.value),
                  })
                }
                aria-label="Valor da opção"
              />
              <Input
                value={o.description ?? ""}
                onChange={(e) =>
                  updateOption(theme.id, criterion.id, o.id, {
                    description: e.target.value,
                  })
                }
                placeholder="Descrição da opção"
                aria-label="Descrição da opção"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeOption(theme.id, criterion.id, o.id)}
                aria-label="Excluir opção"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
