// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import App from "./App"
import { ProjectsView } from "@/components/projects/ProjectsView"
import { ThemesView } from "@/components/themes/ThemesView"
import { SettingsView } from "@/components/settings/SettingsView"
import { BudgetView } from "@/components/budget/BudgetView"
import { HistoryView } from "@/components/history/HistoryView"

// jsdom não implementa ResizeObserver / matchMedia (usados por Radix/recharts).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false
      },
    }) as unknown as MediaQueryList
}

function wrap(node: React.ReactNode) {
  return render(<TooltipProvider>{node}</TooltipProvider>)
}

afterEach(() => cleanup())

describe("App (smoke)", () => {
  it("renderiza o cabeçalho e as abas", () => {
    wrap(<App />)
    expect(screen.getByText("Matriz de Priorização de Projetos")).toBeTruthy()
    expect(screen.getByRole("tab", { name: /Resultados/ })).toBeTruthy()
    expect(screen.getByRole("tab", { name: /Projetos/ })).toBeTruthy()
  })

  it("renderiza as views sem erro de runtime", () => {
    expect(() => wrap(<ProjectsView />)).not.toThrow()
    cleanup()
    expect(() => wrap(<ThemesView />)).not.toThrow()
    cleanup()
    expect(() => wrap(<SettingsView />)).not.toThrow()
    cleanup()
    expect(() => wrap(<BudgetView />)).not.toThrow()
    cleanup()
    expect(() => wrap(<HistoryView />)).not.toThrow()
  })

  it("ThemesView mostra o primeiro tema do seed", () => {
    wrap(<ThemesView />)
    expect(screen.getAllByText(/Aumento de Capacidade/).length).toBeGreaterThan(0)
  })
})
