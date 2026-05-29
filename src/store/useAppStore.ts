import { create } from "zustand"
import { persist } from "zustand/middleware"
import { uid } from "@/lib/id"
import { suggestBands } from "@/lib/scoring"
import { createSeedData, DATA_VERSION } from "@/lib/seed"
import type {
  AppData,
  Band,
  Criterion,
  ID,
  OptionValue,
  Project,
  Theme,
} from "@/lib/types"

const now = () => new Date().toISOString()

// ---- helpers de atualização imutável ----
function mapTheme(themes: Theme[], themeId: ID, fn: (t: Theme) => Theme): Theme[] {
  return themes.map((t) => (t.id === themeId ? fn(t) : t))
}
function mapCriterion(
  theme: Theme,
  criterionId: ID,
  fn: (c: Criterion) => Criterion,
): Theme {
  return {
    ...theme,
    criteria: theme.criteria.map((c) => (c.id === criterionId ? fn(c) : c)),
  }
}

function defaultOption(label: string, value = 0): OptionValue {
  return { id: uid("opt"), label, value, description: "" }
}
function defaultCriterion(): Criterion {
  const values = [1, 2, 5, 10]
  return {
    id: uid("crit"),
    name: "Novo critério",
    description: "",
    weight: 0.1,
    options: ["A", "B", "C", "D"].map((label, i) => defaultOption(label, values[i])),
  }
}
function defaultBands(prefix: string): Band[] {
  return [
    { id: uid(prefix), label: "Baixa", min: 0, color: "#94a3b8" },
    { id: uid(prefix), label: "Média", min: 0, color: "#f59e0b" },
    { id: uid(prefix), label: "Alta", min: 0, color: "#ef4444" },
  ]
}

export interface AppStore {
  themes: Theme[]
  projects: Project[]
  rankBy: "raw" | "pct"

  // temas
  addTheme: () => ID
  updateTheme: (themeId: ID, patch: Partial<Pick<Theme, "name" | "color">>) => void
  removeTheme: (themeId: ID) => void

  // critérios
  addCriterion: (themeId: ID) => void
  updateCriterion: (
    themeId: ID,
    criterionId: ID,
    patch: Partial<Pick<Criterion, "name" | "description" | "weight">>,
  ) => void
  removeCriterion: (themeId: ID, criterionId: ID) => void
  moveCriterion: (themeId: ID, criterionId: ID, dir: -1 | 1) => void

  // opções
  addOption: (themeId: ID, criterionId: ID) => void
  updateOption: (
    themeId: ID,
    criterionId: ID,
    optionId: ID,
    patch: Partial<Pick<OptionValue, "label" | "value" | "description">>,
  ) => void
  removeOption: (themeId: ID, criterionId: ID, optionId: ID) => void

  // faixas
  addBand: (themeId: ID) => void
  updateBand: (
    themeId: ID,
    bandId: ID,
    patch: Partial<Pick<Band, "label" | "min" | "color">>,
  ) => void
  removeBand: (themeId: ID, bandId: ID) => void
  autoBands: (themeId: ID) => void

  // projetos
  addProject: (data: {
    name: string
    themeId: ID
    area?: string
    capex?: number
    notes?: string
  }) => ID
  updateProject: (
    projectId: ID,
    patch: Partial<Pick<Project, "name" | "area" | "themeId" | "capex" | "notes">>,
  ) => void
  setScore: (projectId: ID, criterionId: ID, optionId: ID | null) => void
  /** Cria (se id novo) ou substitui (se id existente) um projeto inteiro. */
  upsertProject: (project: Project) => void
  removeProject: (projectId: ID) => void

  // dados
  importData: (data: AppData) => void
  resetData: () => void
  setRankBy: (by: "raw" | "pct") => void
}

const seed = createSeedData()

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      themes: seed.themes,
      projects: seed.projects,
      rankBy: "pct",

      // ---- temas ----
      addTheme: () => {
        const id = uid("theme")
        const theme: Theme = {
          id,
          name: "Novo tema",
          color: "#6b7280",
          criteria: [],
          bands: defaultBands(id),
        }
        set((s) => ({ themes: [...s.themes, theme] }))
        return id
      },
      updateTheme: (themeId, patch) =>
        set((s) => ({ themes: mapTheme(s.themes, themeId, (t) => ({ ...t, ...patch })) })),
      removeTheme: (themeId) =>
        set((s) => ({
          themes: s.themes.filter((t) => t.id !== themeId),
          projects: s.projects.filter((p) => p.themeId !== themeId),
        })),

      // ---- critérios ----
      addCriterion: (themeId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            criteria: [...t.criteria, defaultCriterion()],
          })),
        })),
      updateCriterion: (themeId, criterionId, patch) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) =>
            mapCriterion(t, criterionId, (c) => ({ ...c, ...patch })),
          ),
        })),
      removeCriterion: (themeId, criterionId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            criteria: t.criteria.filter((c) => c.id !== criterionId),
          })),
        })),
      moveCriterion: (themeId, criterionId, dir) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => {
            const idx = t.criteria.findIndex((c) => c.id === criterionId)
            const next = idx + dir
            if (idx < 0 || next < 0 || next >= t.criteria.length) return t
            const criteria = [...t.criteria]
            ;[criteria[idx], criteria[next]] = [criteria[next], criteria[idx]]
            return { ...t, criteria }
          }),
        })),

      // ---- opções ----
      addOption: (themeId, criterionId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) =>
            mapCriterion(t, criterionId, (c) => {
              const label = String.fromCharCode(65 + c.options.length) // A, B, C...
              return { ...c, options: [...c.options, defaultOption(label)] }
            }),
          ),
        })),
      updateOption: (themeId, criterionId, optionId, patch) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) =>
            mapCriterion(t, criterionId, (c) => ({
              ...c,
              options: c.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o,
              ),
            })),
          ),
        })),
      removeOption: (themeId, criterionId, optionId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) =>
            mapCriterion(t, criterionId, (c) => ({
              ...c,
              options: c.options.filter((o) => o.id !== optionId),
            })),
          ),
        })),

      // ---- faixas ----
      addBand: (themeId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            bands: [
              ...t.bands,
              { id: uid("band"), label: "Nova faixa", min: 0, color: "#94a3b8" },
            ],
          })),
        })),
      updateBand: (themeId, bandId, patch) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            bands: t.bands.map((b) => (b.id === bandId ? { ...b, ...patch } : b)),
          })),
        })),
      removeBand: (themeId, bandId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            bands: t.bands.filter((b) => b.id !== bandId),
          })),
        })),
      autoBands: (themeId) =>
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({ ...t, bands: suggestBands(t) })),
        })),

      // ---- projetos ----
      addProject: (data) => {
        const id = uid("proj")
        const project: Project = {
          id,
          name: data.name,
          area: data.area,
          themeId: data.themeId,
          capex: data.capex,
          notes: data.notes,
          scores: {},
          createdAt: now(),
          updatedAt: now(),
        }
        set((s) => ({ projects: [...s.projects, project] }))
        return id
      },
      updateProject: (projectId, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p
            // Trocar de tema invalida as notas (critérios diferentes).
            const scores =
              patch.themeId && patch.themeId !== p.themeId ? {} : p.scores
            return { ...p, ...patch, scores, updatedAt: now() }
          }),
        })),
      setScore: (projectId, criterionId, optionId) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p
            const scores = { ...p.scores }
            if (optionId === null) delete scores[criterionId]
            else scores[criterionId] = optionId
            return { ...p, scores, updatedAt: now() }
          }),
        })),
      upsertProject: (project) =>
        set((s) => {
          const stamped = { ...project, updatedAt: now() }
          const exists = s.projects.some((p) => p.id === project.id)
          return {
            projects: exists
              ? s.projects.map((p) => (p.id === project.id ? stamped : p))
              : [...s.projects, stamped],
          }
        }),
      removeProject: (projectId) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) })),

      // ---- dados ----
      importData: (data) =>
        set(() => ({
          themes: data.themes ?? [],
          projects: data.projects ?? [],
        })),
      resetData: () => {
        const fresh = createSeedData()
        set(() => ({ themes: fresh.themes, projects: fresh.projects }))
      },
      setRankBy: (by) => set(() => ({ rankBy: by })),
    }),
    {
      name: "matriz-priorizacao-cmpc",
      version: DATA_VERSION,
      migrate: () => {
        const fresh = createSeedData()
        return { themes: fresh.themes, projects: fresh.projects, rankBy: "pct" }
      },
      partialize: (s) => ({
        themes: s.themes,
        projects: s.projects,
        rankBy: s.rankBy,
      }),
    },
  ),
)
