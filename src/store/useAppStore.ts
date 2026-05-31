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
  YearPlan,
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
  plans: YearPlan[]
  activePlanId: ID | null

  // temas
  addTheme: () => ID
  updateTheme: (
    themeId: ID,
    patch: Partial<Pick<Theme, "name" | "color" | "subtypes">>,
  ) => void
  removeTheme: (themeId: ID) => void

  // critérios
  addCriterion: (themeId: ID, subtype?: string) => ID
  updateCriterion: (
    themeId: ID,
    criterionId: ID,
    patch: Partial<Pick<Criterion, "name" | "description" | "weight" | "subtype">>,
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
  /** Acrescenta vários projetos de uma vez (ex.: dados de exemplo). */
  addProjects: (projects: Project[]) => void
  removeProject: (projectId: ID) => void

  // planos anuais (orçamento + carteira aprovada)
  addPlan: (year?: number, budget?: number) => ID
  updatePlan: (planId: ID, patch: Partial<Pick<YearPlan, "year" | "budget">>) => void
  removePlan: (planId: ID) => void
  setActivePlan: (planId: ID | null) => void
  toggleSelected: (planId: ID, projectId: ID) => void
  setSelected: (planId: ID, ids: ID[]) => void
  clearSelected: (planId: ID) => void

  // dados
  importData: (data: AppData) => void
  resetData: () => void
  setRankBy: (by: "raw" | "pct") => void
}

function mapPlan(
  plans: YearPlan[],
  planId: ID,
  fn: (p: YearPlan) => YearPlan,
): YearPlan[] {
  return plans.map((p) => (p.id === planId ? fn(p) : p))
}

const seed = createSeedData()

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      themes: seed.themes,
      projects: seed.projects,
      rankBy: "pct",
      plans: [],
      activePlanId: null,

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
      addCriterion: (themeId, subtype) => {
        const crit = { ...defaultCriterion(), subtype }
        set((s) => ({
          themes: mapTheme(s.themes, themeId, (t) => ({
            ...t,
            criteria: [...t.criteria, crit],
          })),
        }))
        return crit.id
      },
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
      addProjects: (projects) =>
        set((s) => ({ projects: [...s.projects, ...projects] })),
      removeProject: (projectId) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          // remove o projeto de todas as carteiras anuais
          plans: s.plans.map((pl) => ({
            ...pl,
            selectedIds: pl.selectedIds.filter((id) => id !== projectId),
          })),
        })),

      // ---- planos anuais ----
      addPlan: (year, budget) => {
        const id = uid("plan")
        const plan: YearPlan = {
          id,
          year: year ?? new Date().getFullYear(),
          budget: budget ?? 0,
          selectedIds: [],
        }
        set((s) => ({ plans: [...s.plans, plan], activePlanId: id }))
        return id
      },
      updatePlan: (planId, patch) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => ({ ...p, ...patch })),
        })),
      removePlan: (planId) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== planId),
          activePlanId:
            s.activePlanId === planId
              ? (s.plans.find((p) => p.id !== planId)?.id ?? null)
              : s.activePlanId,
        })),
      setActivePlan: (planId) => set(() => ({ activePlanId: planId })),
      toggleSelected: (planId, projectId) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => {
            const has = p.selectedIds.includes(projectId)
            return {
              ...p,
              selectedIds: has
                ? p.selectedIds.filter((id) => id !== projectId)
                : [...p.selectedIds, projectId],
            }
          }),
        })),
      setSelected: (planId, ids) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => ({ ...p, selectedIds: [...ids] })),
        })),
      clearSelected: (planId) =>
        set((s) => ({
          plans: mapPlan(s.plans, planId, (p) => ({ ...p, selectedIds: [] })),
        })),

      // ---- dados ----
      importData: (data) =>
        set(() => ({
          themes: data.themes ?? [],
          projects: data.projects ?? [],
          plans: data.plans ?? [],
          activePlanId: data.plans?.[0]?.id ?? null,
        })),
      resetData: () => {
        const fresh = createSeedData()
        set(() => ({
          themes: fresh.themes,
          projects: fresh.projects,
          plans: [],
          activePlanId: null,
        }))
      },
      setRankBy: (by) => set(() => ({ rankBy: by })),
    }),
    {
      name: "matriz-priorizacao-cmpc",
      version: DATA_VERSION,
      migrate: (persisted) => {
        const NAMES: Record<string, string> = {
          t1: "TEMA 1 - Aumento de Capacidade",
          t2: "TEMA 2 - Melhoria Operacional",
          t3: "TEMA 3 - Sustaining / Manutenção",
          t4: "TEMA 4 - Segurança e Meio Ambiente",
          t5: "TEMA 5 - Outros",
        }
        const state = persisted as {
          themes?: Theme[]
          projects?: Project[]
          rankBy?: "raw" | "pct"
          plans?: YearPlan[]
          activePlanId?: ID | null
        }
        const fresh = createSeedData()
        if (!state || !Array.isArray(state.themes)) {
          return {
            themes: fresh.themes,
            projects: [],
            rankBy: "pct",
            plans: [],
            activePlanId: null,
          }
        }
        // Renomeia os temas; adota a NOVA estrutura (com subtipos) de TEMA 3 e 4.
        const freshById = new Map(fresh.themes.map((t) => [t.id, t]))
        return {
          themes: state.themes.map((t) => {
            if (t.id === "t3" || t.id === "t4") return freshById.get(t.id) ?? t
            return NAMES[t.id] ? { ...t, name: NAMES[t.id] } : t
          }),
          projects: Array.isArray(state.projects) ? state.projects : [],
          rankBy: state.rankBy ?? "pct",
          plans: Array.isArray(state.plans) ? state.plans : [],
          activePlanId: state.activePlanId ?? null,
        }
      },
      partialize: (s) => ({
        themes: s.themes,
        projects: s.projects,
        rankBy: s.rankBy,
        plans: s.plans,
        activePlanId: s.activePlanId,
      }),
    },
  ),
)
