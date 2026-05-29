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
}

/** Um projeto avaliado dentro de um tema. */
export interface Project {
  id: ID
  name: string
  /** Área solicitante. */
  area?: string
  themeId: ID
  /** CapEx em R$ mil (ou na unidade que o usuário preferir). */
  capex?: number
  /** Mapa criterionId -> optionId escolhido. */
  scores: Record<ID, ID>
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Estado serializável completo (persistido em localStorage / Export JSON). */
export interface AppData {
  themes: Theme[]
  projects: Project[]
}

/** Resultado calculado da pontuação de um projeto. */
export interface ScoreResult {
  /** Nota bruta = Σ(valor × peso). */
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
