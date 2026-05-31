import { uid } from "./id"
import { CMPC_AREAS_FLAT } from "./cmpcAreas"
import { applicableCriteria } from "./scoring"
import type { Project, Theme } from "./types"

/**
 * Gerador de projetos de exemplo do contexto de uma fábrica de **celulose**
 * (ex.: CMPC Guaíba) — para popular a matriz rapidamente e testar o ranking.
 */

const ATIVOS = [
  "Caldeira de Recuperação",
  "Forno de Cal",
  "Digestor Contínuo",
  "Linha de Fibras",
  "Planta de Branqueamento",
  "Caustificação",
  "Evaporação de Licor Negro",
  "Pátio de Madeira",
  "Picador (Chipper)",
  "Lavagem de Celulose",
  "Depuração de Massa",
  "Secagem de Celulose",
  "Enfardamento",
  "Precipitador Eletrostático",
  "Turbogerador",
  "Estação de Tratamento de Efluentes",
  "Estação de Tratamento de Água",
  "Planta de Dióxido de Cloro",
  "Planta de Oxigênio",
  "Tanque de Licor Negro",
  "Clarificador de Licor Verde",
  "Desaguamento de Lodo",
  "Casa de Força",
  "Subestação Principal",
  "Sistema de Cavacos",
  "Tomada de Água Bruta",
  "Compressores de Ar",
  "Caldeira de Biomassa",
  "Pátio de Cavacos",
  "Sistema de Vapor",
]

const ACOES = [
  "Revamp",
  "Modernização",
  "Substituição de equipamento",
  "Ampliação de capacidade",
  "Automação",
  "Upgrade tecnológico",
  "Reforma geral",
  "Otimização operacional",
  "Adequação ambiental",
  "Eficiência energética",
  "Aumento de confiabilidade",
  "Troca de componentes críticos",
  "Nova instalação",
  "Redução de consumo específico",
  "Descarbonização",
]

const RESPONSAVEIS = [
  "Engenharia",
  "Manutenção",
  "Processo",
  "PMO",
  "Confiabilidade",
  "Meio Ambiente",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

/** Gera `count` projetos de exemplo distribuídos aleatoriamente entre os temas. */
export function generateSampleProjects(themes: Theme[], count: number): Project[] {
  if (themes.length === 0) return []
  const out: Project[] = []
  for (let i = 0; i < count; i++) {
    const theme = pick(themes)
    const subtype =
      theme.subtypes && theme.subtypes.length ? pick(theme.subtypes) : undefined
    const scores: Record<string, string> = {}
    for (const c of applicableCriteria(theme, subtype)) {
      if (c.options.length) scores[c.id] = pick(c.options).id
    }
    const ts = new Date().toISOString()
    const capex = randInt(30, 6000) * 10000 // US$ 300 mil a 60 milhões
    out.push({
      id: uid("proj"),
      name: `${pick(ATIVOS)} — ${pick(ACOES)}`,
      area: pick(CMPC_AREAS_FLAT),
      plant: pick(["G1", "G2"]),
      themeId: theme.id,
      subtype,
      capex,
      filledBy: pick(RESPONSAVEIS),
      date: new Date().toISOString().slice(0, 10),
      scores,
      vpl: randInt(-500, 4000) * 10000, // US$
      vpi: capex,
      paybackYears: randInt(2, 9),
      notes: "",
      createdAt: ts,
      updatedAt: ts,
    })
  }
  return out
}
