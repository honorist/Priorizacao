import {
  BarChart3,
  FolderKanban,
  History,
  Layers,
  Settings2,
  Wallet,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultsDashboard } from "@/components/results/ResultsDashboard"
import { BudgetView } from "@/components/budget/BudgetView"
import { HistoryView } from "@/components/history/HistoryView"
import { ProjectsView } from "@/components/projects/ProjectsView"
import { ThemesView } from "@/components/themes/ThemesView"
import { SettingsView } from "@/components/settings/SettingsView"

function App() {
  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            CM
          </div>
          <div>
            <h1 className="text-lg leading-tight font-semibold">
              Matriz de Priorização de Projetos
            </h1>
            <p className="text-sm text-muted-foreground">
              CMPC · priorização por temas e critérios ponderados
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="resultados">
          <TabsList>
            <TabsTrigger value="resultados">
              <BarChart3 className="size-4" /> Resultados
            </TabsTrigger>
            <TabsTrigger value="orcamento">
              <Wallet className="size-4" /> Orçamento
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="size-4" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="projetos">
              <FolderKanban className="size-4" /> Projetos
            </TabsTrigger>
            <TabsTrigger value="temas">
              <Layers className="size-4" /> Temas
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings2 className="size-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resultados" className="mt-6">
            <ResultsDashboard />
          </TabsContent>
          <TabsContent value="orcamento" className="mt-6">
            <BudgetView />
          </TabsContent>
          <TabsContent value="historico" className="mt-6">
            <HistoryView />
          </TabsContent>
          <TabsContent value="projetos" className="mt-6">
            <ProjectsView />
          </TabsContent>
          <TabsContent value="temas" className="mt-6">
            <ThemesView />
          </TabsContent>
          <TabsContent value="config" className="mt-6">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App
