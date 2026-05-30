import { useState } from "react"
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
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
import { ThemeDot } from "@/components/common/indicators"
import { scoreProject } from "@/lib/scoring"
import { generateSampleProjects } from "@/lib/sample"
import { fmtCapex, fmtNum } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"
import type { Project } from "@/lib/types"

export function ProjectsView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const removeProject = useAppStore((s) => s.removeProject)
  const addProjects = useAppStore((s) => s.addProjects)
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
  function generateSamples() {
    addProjects(generateSampleProjects(themes, 50))
    toast.success("50 projetos de exemplo (celulose) criados.")
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSamples}>
            <Sparkles className="size-4" /> Gerar 50 exemplos
          </Button>
          <Button onClick={openNew}>
            <Plus className="size-4" /> Novo projeto
          </Button>
        </div>
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
                  <TableHead className="text-right">CapEx (US$)</TableHead>
                  <TableHead className="w-[1%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const theme = themeById.get(p.themeId)
                  const result = theme ? scoreProject(p, theme) : null
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {(p.area || p.plant) && (
                          <div className="text-xs text-muted-foreground">
                            {[p.area, p.plant].filter(Boolean).join(" · ")}
                          </div>
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
