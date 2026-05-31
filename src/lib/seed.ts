import { suggestBands } from "./scoring"
import type { AppData, Band, Criterion, Theme } from "./types"

/**
 * Conteúdo inicial: os 5 temas ("cestas") do CMPC. TEMA 1, 2 e 5 são modelos
 * genéricos editáveis. TEMA 3 (Manutenção) e TEMA 4 (Segurança/Meio Ambiente)
 * reproduzem os critérios, escalas e textos da Matriz de Priorização CMPC.
 */

const VALUES = [1, 2, 5, 10]
const LABELS = ["A", "B", "C", "D"]
const T3_VAL = [0, 1, 5, 10] // valores A/B/C/D do Tema 3 CMPC
const T4_VAL = [1, 2, 3, 4, 5] // escala 1–5 do Tema 4 CMPC
const N5 = ["Muito improvável", "Improvável", "Possível", "Provável", "Muito provável"]

interface CriterionSeed {
  name: string
  description?: string
  weight: number
  /** Descrições das opções (4 = A/B/C/D, ou 5 para escalas 1–5). */
  opts: string[]
  /** Rótulos das opções (default A, B, C, D…). */
  labels?: string[]
  /** Valores das opções (default [1,2,5,10]). */
  values?: number[]
  /** Subtipo do tema a que pertence (vazio = comum). */
  subtype?: string
  /** Seção/grupo do critério (ex.: "Probabilidade", "Impacto"). */
  group?: string
  /** Se verdadeiro, o valor da opção multiplica a nota (em vez de somar). */
  multiplier?: boolean
}

function mkCriterion(tid: string, idx: number, c: CriterionSeed): Criterion {
  const cid = `${tid}-c${idx}`
  return {
    id: cid,
    name: c.name,
    description: c.description,
    weight: c.weight,
    subtype: c.subtype,
    group: c.group,
    multiplier: c.multiplier,
    options: c.opts.map((desc, i) => {
      const label = c.labels?.[i] ?? LABELS[i] ?? String(i + 1)
      return {
        id: `${cid}-${label}`,
        label,
        value: c.values?.[i] ?? VALUES[i] ?? 0,
        description: desc,
      }
    }),
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
  subtypes: string[] = [],
  financial = true,
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
    subtypes: subtypes.length ? subtypes : undefined,
    financial,
  }
  return { ...theme, bands: suggestBands(theme) }
}

const THEME_1 = makeTheme("t1", "TEMA 1 - Aumento de Capacidade", "#2563eb", [
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

const THEME_2 = makeTheme("t2", "TEMA 2 - Melhoria Operacional", "#0891b2", [
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

// TEMA 3 — textos exatos da Matriz CMPC (Tema 3 - Manutenção). Valores A=0,B=1,C=5,D=10.
const THEME_3 = makeTheme(
  "t3",
  "TEMA 3 - Sustaining / Manutenção",
  "#ca8a04",
  [
    {
      name: "Disponibilidade de sobressalentes",
      subtype: "Eletro-eletrônico",
      group: "Probabilidade",
      weight: 0.15,
      values: T3_VAL,
      description:
        "Identificar a disponibilidade de aquisição de sobressalentes no mercado.",
      opts: [
        "Há disponível na CMPC e ou NA",
        "De fácil aquisição do fabricante",
        "Possível através de sub-fornecedor ou similar",
        "Não há sobressalentes disponíveis no mercado",
      ],
    },
    {
      name: "Assistência Técnica (tempo)",
      subtype: "Eletro-eletrônico",
      group: "Probabilidade",
      weight: 0.12,
      values: T3_VAL,
      description:
        "Identificar a existência de suporte técnico para o equipamento no mercado.",
      opts: [
        "Suporte disponível ≥ 3 próximos anos e ou NA",
        "Suporte disponível: 1 ≤ t < 3 próximos anos",
        "Suporte disponível < 1 ano",
        "Não há suporte",
      ],
    },
    {
      name: "Tecnologia",
      subtype: "Eletro-eletrônico",
      group: "Probabilidade",
      weight: 0.12,
      values: T3_VAL,
      description:
        "Identificar se a tecnologia empregada no equipamento ainda é utilizada.",
      opts: [
        "Tecnologia operacional do equipamento ainda é utilizada em equipamentos novos e ou NA",
        "Tecnologia operacional é pouco utilizada e existem poucas alternativas mais eficientes.",
        "Tecnologia operacional quase não é utilizada e já existem outras alternativas mais eficientes.",
        "Tecnologia operacional não é utilizada em equipamentos novos.",
      ],
    },
    {
      name: "Conhecimento técnico",
      subtype: "Eletro-eletrônico",
      group: "Probabilidade",
      weight: 0.11,
      values: T3_VAL,
      description:
        "Identifica a necessidade de mão de obra especializada para execução da manutenção.",
      opts: [
        "Há conhecimento da equipe de execução dentro da CMPC e ou NA",
        "Há conhecimento da equipe de execução da manutenção dentro da CMPC, mas necessita deslocamento da mão de obra entre áreas e/ou entre Usinas.",
        "Pouco conhecimento da equipe de execução da manutenção dentro da CMPC e necessita de contratação de empresa nacional especializada.",
        "Não há conhecimento da equipe de execução da manutenção dentro da CMPC vindo a necessitar da contratação de empresa especializada do exterior.",
      ],
    },
    {
      name: "Quantidade de Falhas Mecânicas",
      subtype: "Mecânico",
      group: "Probabilidade",
      weight: 0.25,
      values: T3_VAL,
      description:
        "Avaliar o histórico de falhas e o tipo de falhas, antes e após a execução de um Grande Reparo.",
      opts: [
        "Qt. de falhas atinge o valor proposto para a meta anual e sem tendência de elevação do indicador e ou NA",
        "Atinge a meta anual, mas com tendência de elevação do indicador. Com um GR é possível reverter a tendência.",
        "Não atinge a meta anual e sem tendência de elevação do indicador. Com um GR é possível adequar o indicador à meta.",
        "Não atinge a meta anual e com tendência de elevação do indicador, e um GR não é mais possível para reverter esta tendência.",
      ],
    },
    {
      name: "Integridade estrutural / Fim de vida",
      subtype: "Mecânico",
      group: "Probabilidade",
      weight: 0.25,
      values: T3_VAL,
      description:
        "Avaliar se o equipamento já atingiu o fim de vida ou está com a integridade estrutural comprometida (laudos da Engenharia de Manutenção).",
      opts: [
        "Equipamento funcional e ou NA",
        "Há indicativos de fim de vida / integridade comprometida, mas sem laudo emitido pela Engenharia de Manutenção.",
        "Há indicativos de fim de vida / integridade comprometida com reincidência ou agravamento dos desvios, mas sem laudo emitido.",
        "Equipamento em fim de vida ou com integridade estrutural comprometida conforme laudo/relatório da Engenharia de Manutenção.",
      ],
    },
    {
      name: "Ocupação da linha",
      group: "Impacto",
      weight: 0.15,
      values: T3_VAL,
      description:
        "Avaliar a ocupação da linha (capacidade nominal x demanda do orçamento) e/ou disponibilidade de fornecimento de E&U.",
      opts: [
        "Equipamento funcional e ou NA",
        "Ocupação menor que 85% — E&U e áreas de apoio: operação da linha com restrição",
        "Ocupação entre 85% e 97,5% — E&U e áreas de apoio: paralisa a produção de uma linha por algumas horas",
        "Ocupação superior a 97,5%, ou paralisa mais de uma linha e/ou a Usina — paralisa a produção por alguns dias",
      ],
    },
    {
      name: "Risco à operação: consequência da falha",
      group: "Impacto",
      weight: 0.2,
      values: T3_VAL,
      description:
        "Avaliar se há alternativas para produção quando o equipamento ou a linha apresenta uma falha.",
      opts: [
        "Sem dados e ou NA",
        "Linha, equipamento ou alimentação de E&U alternativa e de fácil transferência, sem comprometimento da produção",
        "Linha, equipamento ou alimentação de E&U alternativa, mas com comprometimento da produção",
        "Não há linha, equipamento ou alimentação de E&U alternativa; portanto haverá interrupção da produção.",
      ],
    },
    {
      name: "Lucro Cessante (US$)",
      group: "Impacto",
      weight: 0.15,
      values: T3_VAL,
      description:
        "Perda de margem média de contribuição e/ou custo com o restabelecimento da função ou despesas extraordinárias.",
      opts: ["NA", "Baixo", "Médio", "Alto"],
    },
  ],
  ["Eletro-eletrônico", "Mecânico"],
  false,
)

// TEMA 4 — escalas 1–5 exatas da Matriz CMPC (T4 Segurança / Meio Ambiente).
const THEME_4 = makeTheme(
  "t4",
  "TEMA 4 - Segurança e Meio Ambiente",
  "#16a34a",
  [
    {
      name: "Gravidade",
      subtype: "Segurança",
      group: "Avaliação do risco",
      multiplier: true,
      weight: 1,
      values: T4_VAL,
      labels: ["Leve", "Baixa", "Média", "Alta", "Catastrófica"],
      description: "Gravidade do potencial acidente / dano à saúde e ao patrimônio.",
      opts: [
        "Acidentes/doenças com simples atendimento ambulatorial, ou incidentes de baixo potencial. Sem dano ao patrimônio e sem paralisação do processo e/ou máquinas.",
        "Acidentes/doenças sem afastamento, ou incidentes de médio potencial. Sem dano ao patrimônio, mas com paralisação de curto prazo de processos/máquinas, sem prejuízo de produção.",
        "Acidentes/doenças com afastamento, ou incidentes de alto potencial. Danos reversíveis ao patrimônio e paralisação de médio prazo do processo, com prejuízo de produção.",
        "Acidentes/doenças com fatalidade única e/ou lesões irreversíveis. Danos reversíveis ao patrimônio e paralisação de longo prazo do processo, com prejuízo severo.",
        "Acidentes com múltiplas fatalidades ou catastróficos. Destruição ou comprometimento irreversível do patrimônio e paralisação definitiva do processo, com prejuízo extremo.",
      ],
    },
    {
      name: "Exposição / Probabilidade",
      subtype: "Segurança",
      group: "Avaliação do risco",
      multiplier: true,
      weight: 1,
      values: T4_VAL,
      labels: N5,
      description: "Probabilidade de materialização do evento de segurança.",
      opts: [
        "Materialização muito improvável, desconhecida no grupo CMPC ou similares. Não se espera ocorrer nos próximos 20 anos. Exposição < 5% da jornada.",
        "Pouco provável; ocorreu historicamente alguma vez no grupo ou em similares. Pode ocorrer nos próximos 20 anos. Exposição entre 5% e 20% da jornada.",
        "Possível; ocorreu ao menos uma vez no grupo ou em similares nos últimos 5 anos. Pode ocorrer nos próximos 10 anos. Exposição entre 20% e 50% da jornada.",
        "Provável; ocorreu ao menos uma vez no grupo ou em similares nos últimos 12 meses. Pode ocorrer nos próximos 5 anos. Exposição entre 50% e 60% da jornada.",
        "Muito provável; ocorreu mais de uma vez no grupo ou em similares nos últimos 12 meses. Pode ocorrer no próximo ano. Exposição entre 60% e 100% da jornada.",
      ],
    },
    {
      name: "Severidade ambiental",
      subtype: "Meio Ambiente",
      group: "Avaliação do risco",
      multiplier: true,
      weight: 1,
      values: T4_VAL,
      labels: ["Desprezível", "Baixa", "Média", "Alta", "Crítica"],
      description: "Magnitude do potencial impacto ambiental.",
      opts: [
        "Nenhum dano ou dano não mensurável.",
        "Impacto que cause danos mínimos ou irrelevantes. Fica restrito ao local de ocorrência.",
        "Impacto adverso com danos contornáveis com ações imediatas. Fica restrito aos limites internos da empresa.",
        "Impactos que podem extrapolar os limites internos da empresa, podendo afetar áreas vizinhas e/ou comunidades do entorno.",
        "Impacto adverso com danos irreversíveis ou de tempo de recuperação elevado. Extrapola os limites internos e demanda ações imediatas.",
      ],
    },
    {
      name: "Probabilidade / Frequência",
      subtype: "Meio Ambiente",
      group: "Avaliação do risco",
      multiplier: true,
      weight: 1,
      values: T4_VAL,
      labels: N5,
      description: "Chance de ocorrência do evento ambiental.",
      opts: [
        "Teoricamente possível, porém não esperado de ocorrer durante a vida útil da instalação.",
        "Esperado que ocorra pelo menos uma vez durante a vida útil da instalação.",
        "Pode ocorrer pelo menos uma vez por ano OU risco potencial com ações de controle/mitigação.",
        "Pode ocorrer pelo menos uma vez por mês OU risco potencial com ações de controle/mitigação.",
        "Pode ocorrer frequentemente ao longo do dia ou da semana OU risco iminente.",
      ],
    },
  ],
  ["Segurança", "Meio Ambiente"],
  false,
)

const THEME_5 = makeTheme("t5", "TEMA 5 - Outros", "#6b7280", [
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
export const DATA_VERSION = 8
