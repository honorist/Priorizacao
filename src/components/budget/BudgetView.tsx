import { useMemo, useState } from "react"
import {
  Check,
  CircleCheck,
  CircleX,
  Eraser,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ThemeDot } from "@/components/common/indicators"
import { MoneyInput } from "@/components/common/MoneyInput"
import { BudgetBar } from "./BudgetBar"
import { autoFill, planStats } from "@/lib/budget"
import { rankProjects, type RankedProject } from "@/lib/scoring"
import { fmtCapex, fmtNum } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"

/** Marca visual de "cabe no saldo" (✓) ou "não cabe" (✗). */
function FitMark({ ok }: { ok: boolean }) {
  return ok ? (
    <CircleCheck className="size-4 text-emerald-600" />
  ) : (
    <CircleX className="size-4 text-destructive" />
  )
}

/** Formata um valor em milhões de US$ (ex.: "US$ 12,5 mi"). */
function fmtMi(n: number): string {
  return `US$ ${(n / 1_000_000).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} mi`
}

export function BudgetView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const rankBy = useAppStore((s) => s.rankBy)
  const plans = useAppStore((s) => s.plans)
  const activePlanId = useAppStore((s) => s.activePlanId)
  const addPlan = useAppStore((s) => s.addPlan)
  const updatePlan = useAppStore((s) => s.updatePlan)
  const removePlan = useAppStore((s) => s.removePlan)
  const setActivePlan = useAppStore((s) => s.setActivePlan)
  const toggleSelected = useAppStore((s) => s.toggleSelected)
  const setSelected = useAppStore((s) => s.setSelected)
  const clearSelected = useAppStore((s) => s.clearSelected)

  const [themeFilter, setThemeFilter] = useState<string>("all")
  const [onlySelected, setOnlySelected] = useState(false)
  const [view, setView] = useState<"lista" | "kanban">("lista")

  const plan = plans.find((p) => p.id === activePlanId) ?? plans[0]

  const allRanked = useMemo(
    () => rankProjects(projects, themes, { by: rankBy }),
    [projects, themes, rankBy],
  )
  const ranked = useMemo(
    () =>
      themeFilter === "all"
        ? allRanked
        : allRanked.filter((r) => r.theme.id === themeFilter),
    [allRanked, themeFilter],
  )

  function newPlan() {
    const year = plans.length
      ? Math.max(...plans.map((p) => p.year)) + 1
      : new Date().getFullYear()
    addPlan(year, 0)
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="space-y-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum ano cadastrado. Crie um ano, defina o orçamento de CapEx e
            selecione os projetos aprovados.
          </p>
          <Button onClick={newPlan}>
            <Plus className="size-4" /> Novo ano
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectedSet = new Set(plan.selectedIds)
  // projetos já aprovados em anos ANTERIORES saem da lista de candidatos (já feitos)
  const doneEarlier = new Set<string>()
  for (const pl of plans) {
    if (pl.year < plan.year) for (const id of pl.selectedIds) doneEarlier.add(id)
  }
  const visible = ranked.filter((r) => !doneEarlier.has(r.project.id))
  const list = onlySelected
    ? visible.filter((r) => selectedSet.has(r.project.id))
    : visible

  // colunas do kanban: por tema (ordem oficial), cards por nota (list já ordenada)
  const kanbanCols = themes
    .map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      items: list.filter((r) => r.theme.id === t.id) as RankedProject[],
    }))
    .filter((c) => c.items.length > 0)

  // saldo disponível e teste de "cabe no saldo" por projeto
  const remaining = planStats(plan, projects).remaining
  const fitsProject = (r: RankedProject) => {
    const c = r.project.capex && r.project.capex > 0 ? r.project.capex : 0
    const eff = remaining + (selectedSet.has(r.project.id) ? c : 0)
    return c <= eff
  }

  // CapEx selecionado por tema (atualiza ao marcar/desmarcar)
  const byId = new Map(projects.map((p) => [p.id, p]))
  const byThemeTotals = themes.map((t) => {
    let total = 0
    for (const id of plan.selectedIds) {
      const p = byId.get(id)
      if (p && p.themeId === t.id && p.capex && p.capex > 0) total += p.capex
    }
    return { id: t.id, name: t.name, color: t.color, total }
  })

  function runAutoFill() {
    const candidates = allRanked
      .filter((r) => !doneEarlier.has(r.project.id))
      .map((r) => r.project)
    setSelected(plan.id, autoFill(candidates, plan.budget))
    toast.success("Carteira preenchida pelos mais bem ranqueados.")
  }

  return (
    <div className="space-y-4">
      {/* controles do ano */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Select value={plan.id} onValueChange={setActivePlan}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-year">Ano (rótulo)</Label>
            <Input
              id="b-year"
              type="number"
              className="w-28"
              value={plan.year}
              onChange={(e) =>
                updatePlan(plan.id, { year: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-budget">Orçamento de CapEx (US$)</Label>
            <MoneyInput
              id="b-budget"
              className="w-48"
              value={plan.budget}
              onValueChange={(v) => updatePlan(plan.id, { budget: v ?? 0 })}
              placeholder="0"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={newPlan}>
              <Plus className="size-4" /> Novo ano
            </Button>
            <Button variant="outline" onClick={runAutoFill}>
              <Wand2 className="size-4" /> Auto-preencher
            </Button>
            <Button variant="outline" onClick={() => clearSelected(plan.id)}>
              <Eraser className="size-4" /> Limpar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive">
                  <Trash2 className="size-4" /> Excluir ano
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir o ano {plan.year}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove o orçamento e a seleção desse ano. Os projetos não são
                    afetados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => removePlan(plan.id)}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <BudgetBar plan={plan} projects={projects} />

      {/* CapEx selecionado por tema */}
      <div className="flex flex-wrap gap-2">
        {byThemeTotals.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs"
          >
            <ThemeDot color={t.color} />
            <span className="text-muted-foreground">{t.name}</span>
            <b className="tabular-nums">{fmtMi(t.total)}</b>
          </span>
        ))}
      </div>

      {/* filtros da lista */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Tema</span>
          <Select value={themeFilter} onValueChange={setThemeFilter}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os temas</SelectItem>
              {themes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="inline-flex items-center gap-2">
                    <ThemeDot color={t.color} />
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonGroup>
            <Button
              size="sm"
              variant={view === "lista" ? "default" : "outline"}
              onClick={() => setView("lista")}
            >
              Lista
            </Button>
            <Button
              size="sm"
              variant={view === "kanban" ? "default" : "outline"}
              onClick={() => setView("kanban")}
            >
              Kanban
            </Button>
          </ButtonGroup>
          <Button
            variant={onlySelected ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlySelected((v) => !v)}
          >
            {onlySelected ? "Só selecionados" : "Mostrar só selecionados"}
          </Button>
        </div>
      </div>

      {/* lista selecionável */}
      <Card>
        <CardContent className={view === "lista" ? "p-0" : "p-4"}>
          {list.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {projects.length === 0
                ? "Cadastre projetos na aba Projetos para montar a carteira."
                : "Nenhum projeto para mostrar com este filtro."}
            </div>
          ) : view === "lista" ? (
            <div className="divide-y">
              {list.map((r) => {
                const selected = selectedSet.has(r.project.id)
                return (
                  <button
                    key={r.project.id}
                    type="button"
                    onClick={() => toggleSelected(plan.id, r.project.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent",
                      selected && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                    >
                      {selected && <Check className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <ThemeDot color={r.theme.color} />
                        <span className="truncate font-medium">
                          {r.project.name}
                        </span>
                      </span>
                      {(r.project.area || r.project.plant) && (
                        <span className="text-xs text-muted-foreground">
                          {[r.project.area, r.project.plant]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className="w-14 text-right text-sm tabular-nums">
                      {fmtNum(r.result.raw)}
                    </span>
                    <span className="w-28 text-right text-sm tabular-nums">
                      {fmtCapex(r.project.capex)}
                    </span>
                    <span
                      className="flex w-5 justify-center"
                      title={
                        fitsProject(r)
                          ? "Cabe no saldo disponível"
                          : "Não cabe no saldo disponível"
                      }
                    >
                      <FitMark ok={fitsProject(r)} />
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${kanbanCols.length}, minmax(0, 1fr))`,
              }}
            >
              {kanbanCols.map((col) => (
                <div key={col.id} className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <ThemeDot color={col.color} />
                      {col.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {col.items.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.items.map((r) => {
                      const selected = selectedSet.has(r.project.id)
                      return (
                        <div
                          key={r.project.id}
                          onClick={() => toggleSelected(plan.id, r.project.id)}
                          className={cn(
                            "cursor-pointer rounded-md border bg-card p-2",
                            selected && "border-primary ring-1 ring-primary",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm leading-tight font-medium">
                              {r.project.name}
                            </div>
                            {selected && (
                              <Check className="size-4 shrink-0 text-primary" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                            <span className="tabular-nums">
                              Nota <b>{fmtNum(r.result.raw)}</b>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="tabular-nums text-muted-foreground">
                                {fmtCapex(r.project.capex)}
                              </span>
                              <span
                                title={
                                  fitsProject(r)
                                    ? "Cabe no saldo disponível"
                                    : "Não cabe no saldo disponível"
                                }
                              >
                                <FitMark ok={fitsProject(r)} />
                              </span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
