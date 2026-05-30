import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, Plus } from "lucide-react"
import { ThemeDot } from "@/components/common/indicators"
import { BudgetBar } from "@/components/budget/BudgetBar"
import { SankeyChart, type SankeyLink, type SankeyNode } from "./SankeyChart"
import { rankProjects, type RankedProject } from "@/lib/scoring"
import { fmtCapex, fmtNum, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  )
}

const SEP = "⦙" // separador improvável em nomes (tema/área)

export function ResultsDashboard() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const rankBy = useAppStore((s) => s.rankBy)
  const setRankBy = useAppStore((s) => s.setRankBy)
  const plans = useAppStore((s) => s.plans)
  const activePlanId = useAppStore((s) => s.activePlanId)
  const toggleSelected = useAppStore((s) => s.toggleSelected)
  const addPlan = useAppStore((s) => s.addPlan)
  const setActivePlan = useAppStore((s) => s.setActivePlan)
  const [themeFilter, setThemeFilter] = useState<string>("all")
  const [rankView, setRankView] = useState<"table" | "kanban">("table")
  const [selMode, setSelMode] = useState(false)

  const activePlan = plans.find((p) => p.id === activePlanId) ?? plans[0]
  const selectedSet = new Set(activePlan?.selectedIds ?? [])
  const toggleSel = (id: string) => {
    if (activePlan) toggleSelected(activePlan.id, id)
  }

  const ranked = useMemo(
    () =>
      rankProjects(projects, themes, {
        by: rankBy,
        themeId: themeFilter === "all" ? undefined : themeFilter,
      }),
    [projects, themes, rankBy, themeFilter],
  )

  const capexTotal = ranked.reduce((a, r) => a + (r.project.capex ?? 0), 0)
  const completeCount = ranked.filter((r) => r.result.complete).length
  const completePct = ranked.length ? (completeCount / ranked.length) * 100 : 0

  const dist = useMemo(() => {
    const map = new Map<
      string,
      { name: string; full: string; count: number; color: string }
    >()
    for (const r of ranked) {
      const cur =
        map.get(r.theme.id) ??
        {
          name: r.theme.name.includes(" - ")
            ? r.theme.name.split(" - ")[0]
            : r.theme.name,
          full: r.theme.name,
          count: 0,
          color: r.theme.color,
        }
      cur.count += 1
      map.set(r.theme.id, cur)
    }
    return themes
      .filter((t) => map.has(t.id))
      .map((t) => map.get(t.id)!)
  }, [ranked, themes])

  // Sankey: Tema -> Área -> Projeto (largura por CapEx US$).
  // Os nós são inseridos AGRUPADOS POR TEMA (tema na ordem oficial; dentro do tema,
  // áreas e projetos juntos, projetos por nota desc). Com layoutIterations=0 cada
  // tema vira um bloco alinhado nas 3 colunas — minimizando cruzamentos.
  // Áreas são nós por-tema (name = "tema⦙área"); o rótulo mostra só a área.
  const sankey = useMemo(() => {
    const nodes: SankeyNode[] = []
    const links: SankeyLink[] = []
    const seen = new Map<string, number>()
    const uniq = (base: string) => {
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)
      return n === 1 ? base : `${base} (${n})`
    }
    const themeSeen = new Set<string>()
    const areaSeen = new Set<string>() // áreas únicas (compartilhadas entre temas)
    const taAgg = new Map<string, number>() // "tema⦙área" -> CapEx (link tema→área)
    for (const r of ranked) {
      const themeName = r.theme.name
      const areaLabel = r.project.area?.trim() || "(sem área)"
      const projName = uniq(r.project.name || "Projeto")
      const value = r.project.capex && r.project.capex > 0 ? r.project.capex : 1
      if (!themeSeen.has(themeName)) {
        themeSeen.add(themeName)
        nodes.push({ name: themeName, depth: 0, itemStyle: { color: r.theme.color } })
      }
      if (!areaSeen.has(areaLabel)) {
        areaSeen.add(areaLabel)
        nodes.push({ name: areaLabel, depth: 1, itemStyle: { color: "#94a3b8" } })
      }
      nodes.push({ name: projName, depth: 2, itemStyle: { color: r.theme.color } })
      links.push({ source: areaLabel, target: projName, value })
      const key = themeName + SEP + areaLabel
      taAgg.set(key, (taAgg.get(key) ?? 0) + value)
    }
    for (const [key, value] of taAgg) {
      const [themeName, areaLabel] = key.split(SEP)
      links.push({ source: themeName, target: areaLabel, value })
    }
    return { nodes, links }
  }, [ranked])

  const sankeyLabel = (name: string) =>
    name.includes(SEP) ? name.split(SEP)[1] : name

  const sankeyHeight = Math.min(2400, Math.max(420, ranked.length * 28))

  // Kanban: uma coluna por TEMA, na ordem oficial (TEMA 1, 2, 3...).
  // Os cards dentro de cada coluna vêm por nota desc (ranked já vem ordenado).
  const kanban = useMemo(() => {
    const byTheme = new Map<string, RankedProject[]>()
    for (const r of ranked) {
      const arr = byTheme.get(r.theme.id) ?? []
      arr.push(r)
      byTheme.set(r.theme.id, arr)
    }
    return themes
      .filter((t) => byTheme.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        items: byTheme.get(t.id)!,
      }))
  }, [ranked, themes])

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Ainda não há projetos para priorizar. Vá em <strong>Projetos</strong> e
          cadastre o primeiro — o ranking aparece aqui.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* filtros */}
      <div className="flex flex-wrap items-end gap-3">
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
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Ordenar por</span>
          <Select
            value={rankBy}
            onValueChange={(v) => setRankBy(v as "raw" | "pct")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pct">Normalizado (0–100)</SelectItem>
              <SelectItem value="raw">Nota bruta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Projetos" value={fmtNum(ranked.length)} />
        <Kpi label="CapEx total (US$)" value={fmtCapex(capexTotal)} />
        <Kpi label="Pontuação completa" value={fmtPct(completePct)} />
        <Kpi label="Temas" value={fmtNum(themes.length)} />
      </div>

      {/* distribuição por faixa */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por tema</CardTitle>
          <CardDescription>Quantidade de projetos em cada tema.</CardDescription>
        </CardHeader>
        <CardContent>
          {dist.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem classificação disponível.
            </p>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <RTooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      formatter={(value) => [String(value), "Projetos"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {dist.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-xs">
                {dist.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span>
                      <b>{d.name}</b>
                      {" — "}
                      {d.full.includes(" - ")
                        ? d.full.split(" - ").slice(1).join(" - ")
                        : d.full}
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sankey: Tema -> Área -> Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo: Tema → Área → Projeto</CardTitle>
          <CardDescription>
            Agrupado por tema; largura proporcional ao CapEx (US$).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SankeyChart
            nodes={sankey.nodes}
            links={sankey.links}
            height={sankeyHeight}
            valueFormatter={fmtCapex}
            labelFor={sankeyLabel}
          />
        </CardContent>
      </Card>

      {/* ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de priorização</CardTitle>
          <CardDescription>
            Ordenado por {rankBy === "pct" ? "nota normalizada" : "nota bruta"}.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={selMode ? "default" : "outline"}
                onClick={() => setSelMode((v) => !v)}
              >
                {selMode ? "Seleção ligada" : "Selecionar"}
              </Button>
              {selMode &&
                (plans.length > 0 ? (
                  <Select value={activePlan?.id} onValueChange={setActivePlan}>
                    <SelectTrigger size="sm" className="w-24">
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
                ) : (
                  <Button size="sm" variant="outline" onClick={() => addPlan()}>
                    <Plus className="size-4" /> Criar ano
                  </Button>
                ))}
              <ButtonGroup>
                <Button
                  size="sm"
                  variant={rankView === "table" ? "default" : "outline"}
                  onClick={() => setRankView("table")}
                >
                  Tabela
                </Button>
                <Button
                  size="sm"
                  variant={rankView === "kanban" ? "default" : "outline"}
                  onClick={() => setRankView("kanban")}
                >
                  Kanban
                </Button>
              </ButtonGroup>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className={rankView === "table" ? "p-0" : ""}>
          {selMode && activePlan && (
            <div className={rankView === "table" ? "p-4 pb-0" : "pb-3"}>
              <BudgetBar plan={activePlan} projects={projects} />
            </div>
          )}
          {rankView === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {selMode && <TableHead className="w-[1%]" />}
                  <TableHead className="w-[1%]">#</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">CapEx (US$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((r, i) => (
                  <TableRow
                    key={r.project.id}
                    className={cn(
                      selMode && selectedSet.has(r.project.id) && "bg-primary/5",
                    )}
                  >
                    {selMode && (
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleSel(r.project.id)}
                          aria-pressed={selectedSet.has(r.project.id)}
                          aria-label="Selecionar projeto"
                          className={cn(
                            "flex size-5 items-center justify-center rounded border",
                            selectedSet.has(r.project.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {selectedSet.has(r.project.id) && (
                            <Check className="size-3.5" />
                          )}
                        </button>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.project.name}</div>
                      {(r.project.area || r.project.plant) && (
                        <div className="text-xs text-muted-foreground">
                          {[r.project.area, r.project.plant]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <ThemeDot color={r.theme.color} />
                        {r.theme.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(r.result.raw)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtCapex(r.project.capex)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${kanban.length}, minmax(0, 1fr))`,
              }}
            >
              {kanban.map((col) => (
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
                    {col.items.map((r) => (
                      <div
                        key={r.project.id}
                        onClick={selMode ? () => toggleSel(r.project.id) : undefined}
                        className={cn(
                          "rounded-md border bg-card p-2",
                          selMode && "cursor-pointer",
                          selMode &&
                            selectedSet.has(r.project.id) &&
                            "border-primary ring-1 ring-primary",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm leading-tight font-medium">
                            {r.project.name}
                          </div>
                          {selMode && selectedSet.has(r.project.id) && (
                            <Check className="size-4 shrink-0 text-primary" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                          <span className="tabular-nums">
                            Nota <b>{fmtNum(r.result.raw)}</b>
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {fmtCapex(r.project.capex)}
                          </span>
                        </div>
                      </div>
                    ))}
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
