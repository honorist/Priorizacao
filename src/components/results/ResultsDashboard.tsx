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
import {
  Card,
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
import { BandBadge, ThemeDot } from "@/components/common/indicators"
import { rankProjects } from "@/lib/scoring"
import { fmtCapex, fmtNum, fmtPct } from "@/lib/format"
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

export function ResultsDashboard() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const rankBy = useAppStore((s) => s.rankBy)
  const setRankBy = useAppStore((s) => s.setRankBy)
  const [themeFilter, setThemeFilter] = useState<string>("all")

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
    const map = new Map<string, { name: string; count: number; color: string }>()
    for (const r of ranked) {
      if (!r.band) continue
      const cur =
        map.get(r.band.label) ??
        { name: r.band.label, count: 0, color: r.band.color }
      cur.count += 1
      map.set(r.band.label, cur)
    }
    return [...map.values()]
  }, [ranked])

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
              <SelectItem value="pct">% do máximo</SelectItem>
              <SelectItem value="raw">Nota bruta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Projetos" value={fmtNum(ranked.length)} />
        <Kpi label="CapEx total" value={fmtCapex(capexTotal)} />
        <Kpi label="Pontuação completa" value={fmtPct(completePct)} />
        <Kpi label="Temas" value={fmtNum(themes.length)} />
      </div>

      {/* distribuição por faixa */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por faixa</CardTitle>
          <CardDescription>Quantidade de projetos em cada faixa.</CardDescription>
        </CardHeader>
        <CardContent>
          {dist.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem classificação disponível.
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de priorização</CardTitle>
          <CardDescription>
            Ordenado por {rankBy === "pct" ? "percentual do máximo" : "nota bruta"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[1%]">#</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">CapEx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((r, i) => (
                <TableRow key={r.project.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.project.name}</div>
                    {r.project.area && (
                      <div className="text-xs text-muted-foreground">
                        {r.project.area}
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
                    {fmtPct(r.result.pct)}
                  </TableCell>
                  <TableCell>
                    <BandBadge band={r.band} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtCapex(r.project.capex)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
