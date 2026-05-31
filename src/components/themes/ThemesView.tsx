import { useEffect, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
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
  const [newSub, setNewSub] = useState("")

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

  function addAndSelect(subtype?: string) {
    setActiveCritId(addCriterion(theme.id, subtype))
  }
  function addSubtype() {
    const name = newSub.trim()
    const cur = theme.subtypes ?? []
    if (!name || cur.includes(name)) return
    updateTheme(theme.id, { subtypes: [...cur, name] })
    setNewSub("")
  }
  function removeSubtype(name: string) {
    updateTheme(theme.id, {
      subtypes: (theme.subtypes ?? []).filter((s) => s !== name),
    })
  }

  // Seções do editor: cada subtipo (guarda-chuva) + os critérios gerais (comuns).
  const sections =
    theme.subtypes && theme.subtypes.length > 0
      ? [
          ...theme.subtypes.map((st) => ({
            label: st,
            subtype: st as string | undefined,
            items: theme.criteria.filter((c) => c.subtype === st),
          })),
          {
            label: "Gerais (comuns)",
            subtype: undefined as string | undefined,
            items: theme.criteria.filter((c) => !c.subtype),
          },
        ]
      : [
          {
            label: "",
            subtype: undefined as string | undefined,
            items: theme.criteria,
          },
        ]

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
        <CardContent className="space-y-4">
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

          <div className="space-y-1.5">
            <Label>Subtipos (opcional)</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(theme.subtypes ?? []).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSubtype(s)}
                    aria-label="Remover subtipo"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Input
                className="h-8 w-44 text-xs"
                placeholder="Novo subtipo"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSubtype()
                  }
                }}
              />
              <Button size="sm" variant="outline" onClick={addSubtype}>
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ex.: Eletro-eletrônico / Mecânico (TEMA 3) · Segurança / Meio
              Ambiente (TEMA 4). Marque o subtipo de cada critério; "Comum" vale
              para todos.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critérios</CardTitle>
          <CardDescription>
            {theme.subtypes && theme.subtypes.length > 0 ? (
              "Cada subtipo é um guarda-chuva sobre seus critérios. A nota final do projeto soma os critérios do subtipo escolhido + os Gerais (comuns)."
            ) : (
              <>
                Soma dos pesos:{" "}
                <strong className="tabular-nums">{fmtNum(weightSum)}</strong>{" "}
                {weightOff && (
                  <span className="text-amber-600">(recomendado somar 1)</span>
                )}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {theme.criteria.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhum critério ainda.
              </p>
              <Button onClick={() => addAndSelect()}>
                <Plus className="size-4" /> Critério
              </Button>
            </div>
          ) : (
            <>
              {sections.map((sec) => (
                <div key={sec.label || "_"} className="space-y-1.5">
                  {theme.subtypes && theme.subtypes.length > 0 && (
                    <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {sec.label}
                    </div>
                  )}
                  <div className="overflow-x-auto pb-1">
                    <ButtonGroup>
                      {sec.items.map((c) => (
                        <Button
                          key={c.id}
                          variant={c.id === activeCrit?.id ? "default" : "outline"}
                          onClick={() => setActiveCritId(c.id)}
                          className="whitespace-nowrap"
                        >
                          {c.name}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => addAndSelect(sec.subtype)}
                        className="whitespace-nowrap"
                        aria-label="Adicionar critério"
                      >
                        <Plus className="size-4" /> Critério
                      </Button>
                    </ButtonGroup>
                  </div>
                </div>
              ))}
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

    </div>
  )
}
