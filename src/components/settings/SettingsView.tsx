import { useRef } from "react"
import type { ChangeEvent } from "react"
import { Download, RotateCcw, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { DATA_VERSION } from "@/lib/seed"
import { useAppStore } from "@/store/useAppStore"
import type { AppData } from "@/lib/types"

export function SettingsView() {
  const themes = useAppStore((s) => s.themes)
  const projects = useAppStore((s) => s.projects)
  const importData = useAppStore((s) => s.importData)
  const resetData = useAppStore((s) => s.resetData)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const data: AppData = { themes, projects }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `matriz-cmpc-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Modelo exportado.")
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!parsed || !Array.isArray(parsed.themes)) {
          throw new Error("formato inválido")
        }
        importData({
          themes: parsed.themes,
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        })
        toast.success("Modelo importado.")
      } catch {
        toast.error("Arquivo inválido. Use um JSON exportado por este app.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Exportar / Importar</CardTitle>
          <CardDescription>
            Salve ou carregue todo o modelo (temas, critérios e projetos) em um
            arquivo JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleExport}>
            <Download className="size-4" /> Exportar JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurar padrão</CardTitle>
          <CardDescription>
            Volta aos 5 temas e critérios-modelo originais. Remove todos os
            projetos cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <RotateCcw className="size-4" /> Restaurar padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar o modelo padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso apaga suas edições de temas/critérios e todos os projetos.
                  Considere exportar antes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetData()
                    toast.success("Modelo restaurado ao padrão.")
                  }}
                >
                  Restaurar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sobre os dados</CardTitle>
          <CardDescription>
            Tudo é salvo automaticamente neste navegador (localStorage). Use
            Exportar para guardar ou compartilhar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Temas</div>
            <div className="text-lg font-semibold tabular-nums">
              {themes.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Projetos</div>
            <div className="text-lg font-semibold tabular-nums">
              {projects.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Versão do schema</div>
            <div className="text-lg font-semibold tabular-nums">{DATA_VERSION}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
