import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProjectDialog } from "./ProjectDialog"
import { BandBadge, ThemeDot } from "@/components/common/indicators"
import { classify, scoreProject } from "@/lib/scoring"
import { fmtCapex, fmtNum, fmtPct } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { Project } from "@/lib/types"

export function ProjectsView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const removeProject = useAppStore((s) => s.removeProject)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [toDelete, setToDelete] = useState<Project | null>(null)

  const themeById = new Map(themes.map((t) => [t.id, t]))

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(p: Project) {
    setEditing(p)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Projetos</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} projeto(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Novo projeto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum projeto ainda. Clique em <strong>Novo projeto</strong> para
              começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead className="text-right">CapEx</TableHead>
                  <TableHead className="w-[1%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const theme = themeById.get(p.themeId)
                  const result = theme ? scoreProject(p, theme) : null
                  const band =
                    theme && result ? classify(result.raw, theme.bands) : undefined
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.area && (
                          <div className="text-xs text-muted-foreground">{p.area}</div>
                        )}
                        {result && !result.complete && (
                          <div className="text-xs text-amber-600">
                            incompleto ({result.answered}/{result.total})
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {theme ? (
                          <span className="inline-flex items-center gap-1.5">
                            <ThemeDot color={theme.color} />
                            {theme.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result ? fmtNum(result.raw) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result ? fmtPct(result.pct) : "—"}
                      </TableCell>
                      <TableCell>
                        <BandBadge band={band} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtCapex(p.capex)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            aria-label="Editar projeto"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setToDelete(p)}
                            aria-label="Excluir projeto"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => {
          if (!o) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.name}” será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) removeProject(toDelete.id)
                setToDelete(null)
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
