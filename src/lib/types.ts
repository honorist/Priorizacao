/**
 * Modelo de domínio da Matriz de Priorização CMPC.
 *
 * Estrutura: cada **Tema** (cesta) tem seus próprios **Critérios**. Cada critério
 * tem um **peso** e um conjunto de **opções** discretas (A/B/C/D) com valor numérico.
 * A nota de um **Projeto** é Σ(valor da opção escolhida × peso do critério),
 * calculada sempre contra os critérios do tema do projeto. As **faixas** (bands)
 * classificam a nota bruta em Baixa/Média/Alta (limites editáveis).
 */

export type ID = string

/** Documento anexado (guardado como data URL no próprio estado/JSON). */
export interface Attachment {
  id: ID
  name: string
  type: string
  size: number
  dataUrl: string
}

/** Uma opção discreta de um critério (ex.: A, B, C, D). */
export interface OptionValue {
  id: ID
  /** Rótulo curto exibido (ex.: "A"). Editável. */
  label: string
  /** Valor numérico que a opção contribui (multiplicado pelo peso do critério). */
  value: number
  /** Texto explicando o que essa opção significa para o critério. */
  description?: string
}

/** Um critério de pontuação dentro de um tema. */
export interface Criterion {
  id: ID
  name: string
  description?: string
  /** Peso do critério (multiplica o valor da opção escolhida). */
  weight: number
  options: OptionValue[]
  /** Subtipo a que pertence (vazio = comum a todos os subtipos do tema). */
  subtype?: string
  /** Seção/grupo do critério (ex.: "Probabilidade", "Impacto"). */
  group?: string
  /** Se verdadeiro, o valor da opção MULTIPLICA a nota (em vez de somar × peso). */
  multiplier?: boolean
}

/** Faixa de classificação por limite mínimo de nota bruta. */
export interface Band {
  id: ID
  label: string
  /** Limite inferior (inclusive) da nota bruta para cair nesta faixa. */
  min: number
  /** Cor hex (ex.: "#ef4444"). */
  color: string
}

/** Um tema / "cesta" de projetos, com critérios e faixas próprios. */
export interface Theme {
  id: ID
  name: string
  /** Cor hex de destaque do tema. */
  color: string
  criteria: Criterion[]
  bands: Band[]
  /** Subtipos do tema (ex.: "Eletro-eletrônico"/"Mecânico"). Vazio = sem subtipos. */
  subtypes?: string[]
  /** Se false, o projeto não exibe o bloco financeiro (VPL/VPI/Payback). Default true. */
  financial?: boolean
}

/** Um projeto avaliado dentro de um tema. */
export interface Project {
  id: ID
  name: string
  /** Área solicitante. */
  area?: string
  /** Planta: G1, G2 ou Áreas Comuns. */
  plant?: string
  themeId: ID
  /** Subtipo escolhido dentro do tema (quando o tema tem subtipos). */
  subtype?: string
  /** CapEx em US$. */
  capex?: number
  /** Quem preencheu a matriz. */
  filledBy?: string
  /** Data de preenchimento (ISO yyyy-mm-dd). */
  date?: string
  /** Mapa criterionId -> optionId escolhido. */
  scores: Record<ID, ID>
  /** Justificativa da nota, por critério. */
  justifications?: Record<ID, string>
  /** Validação / responsável, por critério. */
  validations?: Record<ID, string>
  /** Documentos anexados, por critério. */
  attachments?: Record<ID, Attachment[]>
  /** Bloco financeiro (US$): Valor Presente Líquido. */
  vpl?: number
  /** Bloco financeiro (US$): Valor Presente do Investimento. */
  vpi?: number
  /** Payback descontado, em anos. */
  paybackYears?: number
  /** Ponderação por partes interessadas — multiplica a nota (1, 1.05, 1.1, 1.2). */
  ponderacao?: number
  /** Critério de desempate (análise caso a caso). */
  tiebreaker?: string
  /** Compromisso legal — números de referência (Segurança / Meio Ambiente). */
  tacNo?: string
  condicionanteNo?: string
  requisitoLegalNo?: string
  acaoCivilNo?: string
  inqueritoCivilNo?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Plano anual: orçamento de CapEx e a carteira de projetos aprovados no ano. */
export interface YearPlan {
  id: ID
  year: number
  /** Orçamento de CapEx do ano (US$). */
  budget: number
  /** Ids dos projetos selecionados/aprovados para o ano. */
  selectedIds: ID[]
}

/** Estado serializável completo (persistido em localStorage / Export JSON). */
export interface AppData {
  themes: Theme[]
  projects: Project[]
  plans?: YearPlan[]
}

/** Resultado calculado da pontuação de um projeto. */
export interface ScoreResult {
  /** Soma ponderada dos critérios = Σ(valor × peso), antes da ponderação. */
  base: number
  /** Multiplicador de ponderação aplicado (1 quando não há). */
  factor: number
  /** Nota final = base × factor. */
  raw: number
  /** Nota máxima possível para o tema. */
  max: number
  /** Percentual da nota máxima (0–100). */
  pct: number
  /** Verdadeiro quando todos os critérios foram respondidos. */
  complete: boolean
  answered: number
  total: number
}
