import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScorePanel } from "./ScorePanel"
import { BandBadge } from "@/components/common/indicators"
import { uid } from "@/lib/id"
import { classify, scoreProject } from "@/lib/scoring"
import { fmtNum, fmtPct } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { ID, Project } from "@/lib/types"

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  defaultThemeId?: ID
}

function emptyDraft(themeId: ID): Project {
  const ts = new Date().toISOString()
  return {
    id: uid("proj"),
    name: "",
    area: "",
    themeId,
    capex: undefined,
    scores: {},
    notes: "",
    createdAt: ts,
    updatedAt: ts,
  }
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  defaultThemeId,
}: ProjectDialogProps) {
  const themes = useAppStore((s) => s.themes)
  const upsertProject = useAppStore((s) => s.upsertProject)
  const [draft, setDraft] = useState<Project>(() =>
    project ?? emptyDraft(defaultThemeId ?? themes[0]?.id ?? ""),
  )

  useEffect(() => {
    if (open) setDraft(project ?? emptyDraft(defaultThemeId ?? themes[0]?.id ?? ""))
  }, [open, project, defaultThemeId, themes])

  const theme = themes.find((t) => t.id === draft.themeId)
  const result = theme ? scoreProject(draft, theme) : null
  const band = theme && result ? classify(result.raw, theme.bands) : undefined

  function setField<K extends keyof Project>(key: K, value: Project[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }
  function changeTheme(themeId: ID) {
    setDraft((d) => ({ ...d, themeId, scores: {} }))
  }
  function setScore(criterionId: ID, optionId: ID | null) {
    setDraft((d) => {
      const scores = { ...d.scores }
      if (optionId === null) delete scores[criterionId]
      else scores[criterionId] = optionId
      return { ...d, scores }
    })
  }
  function save() {
    if (!draft.name.trim()) {
      toast.error("Dê um nome ao projeto.")
      return
    }
    if (!draft.themeId) {
      toast.error("Selecione um tema.")
      return
    }
    upsertProject({ ...draft, name: draft.name.trim() })
    toast.success(project ? "Projeto atualizado." : "Projeto criado.")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>{project ? "Editar projeto" : "Novo projeto"}</DialogTitle>
          <DialogDescription>
            Defina os dados e pontue o projeto nos critérios do tema.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60svh] space-y-4 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-name">Nome do projeto</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex.: Nova subestação da linha 2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-area">Área solicitante</Label>
              <Input
                id="p-area"
                value={draft.area ?? ""}
                onChange={(e) => setField("area", e.target.value)}
                placeholder="Ex.: Recuperação Química"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-capex">CapEx (R$)</Label>
              <Input
                id="p-capex"
                type="number"
                inputMode="numeric"
                value={draft.capex ?? ""}
                onChange={(e) =>
                  setField(
                    "capex",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tema (cesta)</Label>
              <Select value={draft.themeId} onValueChange={changeTheme}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {theme && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pontuação</h3>
                {result && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Nota</span>
                    <span className="font-semibold tabular-nums">
                      {fmtNum(result.raw)}
                    </span>
                    <span className="text-muted-foreground">
                      ({fmtPct(result.pct)})
                    </span>
                    <BandBadge band={band} />
                  </div>
                )}
              </div>
              <ScorePanel theme={theme} scores={draft.scores} onChange={setScore} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="p-notes">Observações</Label>
            <Textarea
              id="p-notes"
              value={draft.notes ?? ""}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="border-t p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>{project ? "Salvar" : "Criar projeto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
