import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ThemeDot } from "@/components/common/indicators"
import { planStats } from "@/lib/budget"
import { rankProjects } from "@/lib/scoring"
import { fmtCapex, fmtNum } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { Project } from "@/lib/types"

/** Histórico das carteiras priorizadas/aprovadas por ano. */
export function HistoryView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const plans = useAppStore((s) => s.plans)

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Nenhum ano planejado ainda. Crie um ano e selecione projetos na aba{" "}
          <strong>Orçamento</strong> — o histórico de priorização aparece aqui.
        </CardContent>
      </Card>
    )
  }

  const byId = new Map(projects.map((p) => [p.id, p]))
  const ordered = [...plans].sort((a, b) => a.year - b.year)

  return (
    <div className="space-y-4">
      {ordered.map((plan) => {
        const stats = planStats(plan, projects)
        const sel = plan.selectedIds
          .map((id) => byId.get(id))
          .filter((p): p is Project => Boolean(p))
        const rows = rankProjects(sel, themes, { by: "raw" })
        return (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>Ano {plan.year}</CardTitle>
              <CardDescription>
                {stats.count} projeto(s) · Orçamento {fmtCapex(stats.budget)} ·
                Aprovado {fmtCapex(stats.total)} · Saldo{" "}
                {fmtCapex(stats.remaining)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rows.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum projeto aprovado neste ano.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[1%]">#</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Tema</TableHead>
                      <TableHead className="text-right">Nota</TableHead>
                      <TableHead className="text-right">CapEx (US$)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
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
                          {fmtCapex(r.project.capex)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
