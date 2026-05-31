import { useState } from "react"
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Filter,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"
import type { Project } from "@/lib/types"

type SortKey = "name" | "theme" | "nota" | "capex"

export function ProjectsView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const removeProject = useAppStore((s) => s.removeProject)
  const addProjects = useAppStore((s) => s.addProjects)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [toDelete, setToDelete] = useState<Project | null>(null)
  const [areaFilter, setAreaFilter] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const themeById = new Map(themes.map((t) => [t.id, t]))
  const areas = [
    ...new Set(projects.map((p) => p.area).filter((a): a is string => !!a)),
  ].sort((a, b) => a.localeCompare(b))
  const filtered =
    areaFilter.length === 0
      ? projects
      : projects.filter((p) => p.area && areaFilter.includes(p.area))

  function toggleArea(a: string, checked: boolean) {
    setAreaFilter((prev) =>
      checked ? [...prev, a] : prev.filter((x) => x !== a),
    )
  }

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(k)
      setSortDir(k === "nota" || k === "capex" ? "desc" : "asc")
    }
  }
  const sortVal = (p: Project): string | number => {
    if (sortKey === "name") return p.name.toLowerCase()
    if (sortKey === "theme")
      return (themeById.get(p.themeId)?.name ?? "").toLowerCase()
    if (sortKey === "capex") return p.capex ?? 0
    const t = themeById.get(p.themeId)
    return t ? scoreProject(p, t).raw : 0
  }
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = sortVal(a)
        const bv = sortVal(b)
        const cmp =
          typeof av === "string" && typeof bv === "string"
            ? av.localeCompare(bv)
            : (av as number) - (bv as number)
        return sortDir === "asc" ? cmp : -cmp
      })
    : filtered

  function sortHead(label: string, k: SortKey, align?: "right") {
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    )
  }

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
            {areaFilter.length > 0
              ? `${filtered.length} de ${projects.length} projeto(s)`
              : `${projects.length} projeto(s) cadastrado(s)`}
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

      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4" /> Área
                {areaFilter.length > 0 ? ` (${areaFilter.length})` : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-72 w-64 overflow-auto">
              <DropdownMenuLabel>Filtrar por área</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {areas.length === 0 ? (
                <DropdownMenuItem disabled>Sem áreas</DropdownMenuItem>
              ) : (
                areas.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a}
                    checked={areaFilter.includes(a)}
                    onCheckedChange={(c) => toggleArea(a, Boolean(c))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {a}
                  </DropdownMenuCheckboxItem>
                ))
              )}
              {areaFilter.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAreaFilter([])}>
                    Limpar filtro
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {areaFilter.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {areaFilter.join(", ")}
            </span>
          )}
        </div>
      )}

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
                  <TableHead>{sortHead("Projeto", "name")}</TableHead>
                  <TableHead>{sortHead("Tema", "theme")}</TableHead>
                  <TableHead className="text-right">
                    {sortHead("Nota", "nota", "right")}
                  </TableHead>
                  <TableHead className="text-right">
                    {sortHead("CapEx (US$)", "capex", "right")}
                  </TableHead>
                  <TableHead className="w-[1%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => {
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
