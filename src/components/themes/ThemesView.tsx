import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { CriterionEditor } from "./CriterionEditor"
import { BandEditor } from "./BandEditor"
import { ThemeDot } from "@/components/common/indicators"
import { fmtNum } from "@/lib/format"
import { useAppStore } from "@/store/useAppStore"

export function ThemesView() {
  const themes = useAppStore((s) => s.themes)
  const addTheme = useAppStore((s) => s.addTheme)
  const updateTheme = useAppStore((s) => s.updateTheme)
  const removeTheme = useAppStore((s) => s.removeTheme)
  const addCriterion = useAppStore((s) => s.addCriterion)
  const [activeId, setActiveId] = useState("")
  const [activeCritId, setActiveCritId] = useState("")

  const theme = themes.find((t) => t.id === activeId) ?? themes[0]

  useEffect(() => {
    if (theme && theme.id !== activeId) setActiveId(theme.id)
  }, [theme, activeId])

  const activeCrit =
    theme?.criteria.find((c) => c.id === activeCritId) ?? theme?.criteria[0]

  useEffect(() => {
    if (activeCrit && activeCrit.id !== activeCritId) setActiveCritId(activeCrit.id)
  }, [activeCrit, activeCritId])

  if (!theme) {
    return (
      <Card>
        <CardContent className="space-y-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum tema cadastrado. Crie o primeiro.
          </p>
          <Button onClick={() => setActiveId(addTheme())}>
            <Plus className="size-4" /> Novo tema
          </Button>
        </CardContent>
      </Card>
    )
  }

  const weightSum = theme.criteria.reduce((a, c) => a + c.weight, 0)
  const weightOff = Math.abs(weightSum - 1) > 0.001

  function addAndSelect() {
    setActiveCritId(addCriterion(theme.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label>Tema (cesta) em edição</Label>
          <Select value={theme.id} onValueChange={setActiveId}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        <Button variant="outline" onClick={() => setActiveId(addTheme())}>
          <Plus className="size-4" /> Novo tema
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do tema</CardTitle>
          <CardDescription>Nome e cor de destaque da cesta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1 space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={theme.name}
                onChange={(e) => updateTheme(theme.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cor</Label>
              <Input
                type="color"
                className="h-9 w-16 p-1"
                value={theme.color}
                onChange={(e) => updateTheme(theme.id, { color: e.target.value })}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive">
                  <Trash2 className="size-4" /> Excluir tema
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir tema?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Excluir “{theme.name}” remove também todos os projetos dessa
                    cesta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      removeTheme(theme.id)
                      setActiveId("")
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critérios</CardTitle>
          <CardDescription>
            Soma dos pesos:{" "}
            <strong className="tabular-nums">{fmtNum(weightSum)}</strong>{" "}
            {weightOff && (
              <span className="text-amber-600">(recomendado somar 1)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {theme.criteria.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhum critério ainda.
              </p>
              <Button onClick={addAndSelect}>
                <Plus className="size-4" /> Critério
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-1">
                <ButtonGroup>
                  {theme.criteria.map((c, i) => (
                    <Button
                      key={c.id}
                      variant={c.id === activeCrit?.id ? "default" : "outline"}
                      onClick={() => setActiveCritId(c.id)}
                      className="whitespace-nowrap"
                    >
                      {i + 1}. {c.name}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addAndSelect}
                    className="whitespace-nowrap"
                    aria-label="Adicionar critério"
                  >
                    <Plus className="size-4" /> Critério
                  </Button>
                </ButtonGroup>
              </div>
              {activeCrit && (
                <CriterionEditor
                  key={activeCrit.id}
                  theme={theme}
                  criterion={activeCrit}
                  index={theme.criteria.findIndex((c) => c.id === activeCrit.id)}
                  count={theme.criteria.length}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faixas de classificação</CardTitle>
          <CardDescription>
            Limites de nota para classificar os projetos (Baixa/Média/Alta,
            editáveis).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BandEditor theme={theme} />
        </CardContent>
      </Card>
    </div>
  )
}
