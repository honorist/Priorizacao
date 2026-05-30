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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MoneyInput } from "@/components/common/MoneyInput"
import { ScorePanel } from "./ScorePanel"
import { CMPC_AREA_GROUPS, CMPC_AREAS_FLAT, CMPC_PLANTS } from "@/lib/cmpcAreas"
import { BandBadge } from "@/components/common/indicators"
import { uid } from "@/lib/id"
import { classify, scoreProject } from "@/lib/scoring"
import { fmtNum, fmtPct } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { Attachment, ID, Project } from "@/lib/types"

const MAX_ATTACHMENT = 1.5 * 1024 * 1024 // ~1,5 MB (anexos ficam no navegador)

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  defaultThemeId?: ID
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft(themeId: ID): Project {
  const ts = new Date().toISOString()
  return {
    id: uid("proj"),
    name: "",
    area: "",
    themeId,
    capex: undefined,
    filledBy: "",
    date: today(),
    scores: {},
    justifications: {},
    validations: {},
    vpl: undefined,
    vpi: undefined,
    paybackYears: undefined,
    ponderacao: 1,
    tiebreaker: "",
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
  const [otherArea, setOtherArea] = useState(false)

  useEffect(() => {
    if (!open) return
    const d = project ?? emptyDraft(defaultThemeId ?? themes[0]?.id ?? "")
    setDraft(d)
    setOtherArea(!!d.area && !CMPC_AREAS_FLAT.includes(d.area))
  }, [open, project, defaultThemeId, themes])

  const theme = themes.find((t) => t.id === draft.themeId)
  const result = theme ? scoreProject(draft, theme) : null
  const band = theme && result ? classify(result.raw, theme.bands) : undefined

  function setField<K extends keyof Project>(key: K, value: Project[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }
  function setNum<K extends keyof Project>(key: K, raw: string) {
    setField(key, (raw === "" ? undefined : Number(raw)) as Project[K])
  }
  function changeTheme(themeId: ID) {
    setDraft((d) => ({
      ...d,
      themeId,
      scores: {},
      justifications: {},
      validations: {},
    }))
  }
  function setScore(criterionId: ID, optionId: ID | null) {
    setDraft((d) => {
      const scores = { ...d.scores }
      if (optionId === null) delete scores[criterionId]
      else scores[criterionId] = optionId
      return { ...d, scores }
    })
  }
  function setText(
    criterionId: ID,
    kind: "justification" | "validation",
    value: string,
  ) {
    setDraft((d) => {
      const key = kind === "justification" ? "justifications" : "validations"
      const map = { ...(d[key] ?? {}) }
      if (value === "") delete map[criterionId]
      else map[criterionId] = value
      return { ...d, [key]: map }
    })
  }
  function addAttachment(criterionId: ID, file: File) {
    if (file.size > MAX_ATTACHMENT) {
      toast.error(
        "Arquivo grande demais (máx. ~1,5 MB). Os anexos ficam salvos no navegador.",
      )
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const att: Attachment = {
        id: uid("att"),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: String(reader.result),
      }
      setDraft((d) => {
        const map = { ...(d.attachments ?? {}) }
        map[criterionId] = [...(map[criterionId] ?? []), att]
        return { ...d, attachments: map }
      })
    }
    reader.readAsDataURL(file)
  }
  function removeAttachment(criterionId: ID, attId: ID) {
    setDraft((d) => {
      const map = { ...(d.attachments ?? {}) }
      const next = (map[criterionId] ?? []).filter((a) => a.id !== attId)
      if (next.length === 0) delete map[criterionId]
      else map[criterionId] = next
      return { ...d, attachments: map }
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
    upsertProject({ ...draft, name: draft.name.trim(), date: draft.date || today() })
    toast.success(project ? "Projeto atualizado." : "Projeto criado.")
    onOpenChange(false)
  }

  const ratio =
    draft.vpl != null && draft.vpi != null && draft.vpi !== 0
      ? draft.vpl / draft.vpi
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle>{project ? "Editar projeto" : "Novo projeto"}</DialogTitle>
          <DialogDescription>
            Defina os dados e pontue o projeto nos critérios do tema.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62svh] space-y-4 overflow-y-auto p-4">
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
              <Label>Área solicitante</Label>
              <Select
                value={otherArea ? "__outros__" : draft.area || ""}
                onValueChange={(v) => {
                  if (v === "__outros__") {
                    setOtherArea(true)
                    setField("area", "")
                  } else {
                    setOtherArea(false)
                    setField("area", v)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {CMPC_AREA_GROUPS.map((g) => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.areas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectItem value="__outros__">Outros (especificar)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {otherArea && (
                <Input
                  className="mt-2"
                  placeholder="Especifique a área"
                  value={draft.area ?? ""}
                  onChange={(e) => setField("area", e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Planta</Label>
              <Select
                value={draft.plant || ""}
                onValueChange={(v) => setField("plant", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="G1 / G2" />
                </SelectTrigger>
                <SelectContent>
                  {CMPC_PLANTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-capex">CapEx (US$)</Label>
              <MoneyInput
                id="p-capex"
                value={draft.capex}
                onValueChange={(v) => setField("capex", v)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-filledby">Preenchido por</Label>
              <Input
                id="p-filledby"
                value={draft.filledBy ?? ""}
                onChange={(e) => setField("filledBy", e.target.value)}
                placeholder="Nome / área"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de preenchimento</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                {draft.date ? draft.date.split("-").reverse().join("/") : "—"}
              </div>
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
                    {result.factor !== 1 && (
                      <span className="text-muted-foreground">
                        × {fmtNum(result.factor)}
                      </span>
                    )}
                    <BandBadge band={band} />
                  </div>
                )}
              </div>
              <ScorePanel
                theme={theme}
                scores={draft.scores}
                justifications={draft.justifications ?? {}}
                validations={draft.validations ?? {}}
                attachments={draft.attachments ?? {}}
                onChange={setScore}
                onText={setText}
                onAddAttachment={addAttachment}
                onRemoveAttachment={removeAttachment}
              />
            </div>
          )}

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-semibold">Bloco financeiro (US$)</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-vpl">VPL (US$)</Label>
                <MoneyInput
                  id="p-vpl"
                  value={draft.vpl}
                  onValueChange={(v) => setField("vpl", v)}
                  allowNegative
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-vpi">VPI (US$)</Label>
                <MoneyInput
                  id="p-vpi"
                  value={draft.vpi}
                  onValueChange={(v) => setField("vpi", v)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-pb">Payback descontado (anos)</Label>
                <Input
                  id="p-pb"
                  type="number"
                  step="0.1"
                  value={draft.paybackYears ?? ""}
                  onChange={(e) => setNum("paybackYears", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            {ratio != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                VPL / VPI:{" "}
                <strong className="text-foreground tabular-nums">
                  {fmtNum(ratio)}
                </strong>
              </p>
            )}
          </div>

          <div className="rounded-lg border p-3">
            <h3 className="mb-2 text-sm font-semibold">
              Ponderação e compromisso legal
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Ponderação (partes interessadas)</Label>
                <Select
                  value={String(draft.ponderacao ?? 1)}
                  onValueChange={(v) => setField("ponderacao", Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1,00 — Não aplicável</SelectItem>
                    <SelectItem value="1.05">
                      1,05 — Fiscalização / autuação / reclamação
                    </SelectItem>
                    <SelectItem value="1.1">
                      1,10 — Requisito legal / inquérito do MP
                    </SelectItem>
                    <SelectItem value="1.2">
                      1,20 — É condicionante ou TAC
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Multiplica a nota final do projeto.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-tac">TAC nº</Label>
                <Input
                  id="p-tac"
                  value={draft.tacNo ?? ""}
                  onChange={(e) => setField("tacNo", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-cond">Condicionante nº</Label>
                <Input
                  id="p-cond"
                  value={draft.condicionanteNo ?? ""}
                  onChange={(e) => setField("condicionanteNo", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-req">Requisito legal nº</Label>
                <Input
                  id="p-req"
                  value={draft.requisitoLegalNo ?? ""}
                  onChange={(e) => setField("requisitoLegalNo", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-acp">Ação Civil Pública nº</Label>
                <Input
                  id="p-acp"
                  value={draft.acaoCivilNo ?? ""}
                  onChange={(e) => setField("acaoCivilNo", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-icv">Inquérito Civil nº</Label>
                <Input
                  id="p-icv"
                  value={draft.inqueritoCivilNo ?? ""}
                  onChange={(e) => setField("inqueritoCivilNo", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="p-tie">Critério de desempate</Label>
                <Textarea
                  id="p-tie"
                  rows={2}
                  value={draft.tiebreaker ?? ""}
                  onChange={(e) => setField("tiebreaker", e.target.value)}
                  placeholder="Análise caso a caso (Diretoria Local + Gerência Geral)"
                />
              </div>
            </div>
          </div>

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
