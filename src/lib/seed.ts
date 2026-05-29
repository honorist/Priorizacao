import { suggestBands } from "./scoring"
import type { AppData, Band, Criterion, Theme } from "./types"

/**
 * Conteúdo inicial editável: os 5 temas ("cestas") do CMPC, cada um com um
 * conjunto de critérios-modelo (adaptados da Matriz de Priorização Usiminas).
 * Tudo pode ser ajustado no app — isto é só o ponto de partida.
 */

/** Valores padrão das opções A/B/C/D. */
const VALUES = [1, 2, 5, 10]
const LABELS = ["A", "B", "C", "D"]

interface CriterionSeed {
  name: string
  description?: string
  weight: number
  /** Descrições das opções na ordem A, B, C, D. */
  opts: [string, string, string, string]
}

function mkCriterion(tid: string, idx: number, c: CriterionSeed): Criterion {
  const cid = `${tid}-c${idx}`
  return {
    id: cid,
    name: c.name,
    description: c.description,
    weight: c.weight,
    options: LABELS.map((label, i) => ({
      id: `${cid}-${label}`,
      label,
      value: VALUES[i],
      description: c.opts[i],
    })),
  }
}

const BAND_DEFS = [
  { label: "Baixa", color: "#94a3b8" },
  { label: "Média", color: "#f59e0b" },
  { label: "Alta", color: "#ef4444" },
]

function makeTheme(
  tid: string,
  name: string,
  color: string,
  criteria: CriterionSeed[],
): Theme {
  const bands: Band[] = BAND_DEFS.map((b, i) => ({
    id: `${tid}-b${i + 1}`,
    label: b.label,
    min: 0,
    color: b.color,
  }))
  const theme: Theme = {
    id: tid,
    name,
    color,
    criteria: criteria.map((c, i) => mkCriterion(tid, i + 1, c)),
    bands,
  }
  return { ...theme, bands: suggestBands(theme) }
}

const THEME_1 = makeTheme("t1", "Aumento de Capacidade", "#2563eb", [
  {
    name: "Ganho de capacidade",
    description: "Incremento de capacidade produtiva proporcionado pelo projeto.",
    weight: 0.35,
    opts: ["Sem ganho relevante", "Até 5%", "Entre 5% e 15%", "Acima de 15%"],
  },
  {
    name: "Retorno financeiro (VPL / Payback)",
    description: "Atratividade econômica do investimento.",
    weight: 0.3,
    opts: [
      "Payback > 8 anos / VPL baixo",
      "Payback 5–8 anos",
      "Payback 3–5 anos",
      "Payback < 3 anos / VPL alto",
    ],
  },
  {
    name: "Aderência estratégica",
    description: "Alinhamento com o plano de negócio / Master Plan.",
    weight: 0.2,
    opts: ["Baixa", "Média", "Alta", "Crítica para o plano de negócio"],
  },
  {
    name: "Demanda de mercado",
    description: "Solidez da demanda que justifica o aumento.",
    weight: 0.15,
    opts: ["Incerta", "Estável", "Crescente", "Firme / contratada"],
  },
])

const THEME_2 = makeTheme("t2", "Melhoria Operacional", "#0891b2", [
  {
    name: "Redução de custo",
    description: "Economia recorrente em custos operacionais.",
    weight: 0.3,
    opts: ["Irrelevante", "Baixa", "Média", "Alta"],
  },
  {
    name: "Ganho de eficiência / OEE",
    description: "Aumento de produtividade ou disponibilidade.",
    weight: 0.25,
    opts: ["Sem ganho", "Até 2 p.p.", "2–5 p.p.", "Acima de 5 p.p."],
  },
  {
    name: "Qualidade do produto",
    description: "Impacto na qualidade / não-conformidades.",
    weight: 0.2,
    opts: [
      "Sem efeito",
      "Melhoria leve",
      "Melhoria moderada",
      "Elimina não-conformidade crítica",
    ],
  },
  {
    name: "Confiabilidade do processo",
    description: "Estabilidade e previsibilidade da operação.",
    weight: 0.25,
    opts: ["Sem efeito", "Baixa", "Média", "Alta"],
  },
])

const THEME_3 = makeTheme("t3", "Sustaining / Manutenção", "#ca8a04", [
  {
    name: "Probabilidade de falha",
    description: "Histórico e tendência de falhas do equipamento.",
    weight: 0.3,
    opts: ["Baixa / NA", "Ocasional", "Provável", "Iminente / recorrente"],
  },
  {
    name: "Risco à operação (consequência da falha)",
    description: "Existência de alternativa de produção em caso de falha.",
    weight: 0.3,
    opts: [
      "Há alternativa de fácil transferência",
      "Alternativa com comprometimento",
      "Para a linha por algumas horas",
      "Para a linha por dias / a usina",
    ],
  },
  {
    name: "Lucro cessante",
    description: "Perda de margem / custo de restabelecimento.",
    weight: 0.25,
    opts: ["NA", "Baixo", "Médio", "Alto"],
  },
  {
    name: "Obsolescência / sobressalentes",
    description: "Disponibilidade de peças e suporte do fabricante.",
    weight: 0.15,
    opts: [
      "Disponível na empresa",
      "Fácil aquisição",
      "Via sub-fornecedor / similar",
      "Sem suporte / sem peças",
    ],
  },
])

const THEME_4 = makeTheme("t4", "Segurança e Meio Ambiente", "#16a34a", [
  {
    name: "Gravidade (segurança)",
    description: "Severidade do potencial acidente / dano à saúde.",
    weight: 0.3,
    opts: [
      "Leve (sem afastamento)",
      "Baixa",
      "Média (com afastamento)",
      "Alta / fatalidade",
    ],
  },
  {
    name: "Severidade ambiental",
    description: "Magnitude do potencial impacto ambiental.",
    weight: 0.25,
    opts: [
      "Desprezível",
      "Baixa (restrita ao local)",
      "Média (limites internos)",
      "Alta / crítica (extrapola limites)",
    ],
  },
  {
    name: "Probabilidade / Frequência",
    description: "Chance de ocorrência do evento.",
    weight: 0.25,
    opts: ["Raro", "Pouco provável", "Provável", "Frequente"],
  },
  {
    name: "Exigência legal / normativa",
    description: "Vinculação a requisito legal ou normativo.",
    weight: 0.2,
    opts: [
      "Não aplicável",
      "Recomendável",
      "Requisito aplicável",
      "Exigência legal com prazo / multa",
    ],
  },
])

const THEME_5 = makeTheme("t5", "Outros", "#6b7280", [
  {
    name: "Urgência",
    description: "Prazo para realização do projeto.",
    weight: 0.3,
    opts: [
      "Sem prazo definido",
      "Mais de 12 meses",
      "6–12 meses",
      "Menos de 6 meses / imediata",
    ],
  },
  {
    name: "Benefício percebido",
    description: "Valor percebido pelas áreas envolvidas.",
    weight: 0.25,
    opts: ["Baixo", "Médio", "Alto", "Muito alto"],
  },
  {
    name: "Esforço / Custo",
    description: "Facilidade de execução (menor esforço pontua mais).",
    weight: 0.2,
    opts: ["Muito alto", "Alto", "Médio", "Baixo"],
  },
  {
    name: "Risco de não fazer",
    description: "Consequência de postergar ou não executar.",
    weight: 0.25,
    opts: ["Desprezível", "Baixo", "Médio", "Alto"],
  },
])

/** Cria uma cópia nova do conjunto de dados inicial (temas + projetos vazios). */
export function createSeedData(): AppData {
  return {
    themes: [THEME_1, THEME_2, THEME_3, THEME_4, THEME_5],
    projects: [],
  }
}

/** Versão do schema de dados — usada para migração/reset do estado persistido. */
export const DATA_VERSION = 1
