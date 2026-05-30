/**
 * Áreas da CMPC Guaíba, agrupadas por processo (divisão operacional).
 * Base: norma 410-004-30001 (Classificação de Áreas e Seções) + tabela mestre
 * de áreas do plugin honório (references/clientes/cmpc/equipamentos/areas-mestre).
 */

export interface CmpcAreaGroup {
  label: string
  areas: string[]
}

export const CMPC_AREA_GROUPS: CmpcAreaGroup[] = [
  {
    label: "Fabricação de Celulose",
    areas: [
      "Pátio de Madeiras",
      "Linha de Fibras",
      "Branqueamento",
      "Secagem",
      "Enfardamento",
      "Depósito de Celulose",
      "Papel",
    ],
  },
  {
    label: "Recuperação e Utilidades",
    areas: [
      "Caldeira de Recuperação / Evaporação",
      "Caustificação",
      "Planta Química",
      "Cloro-Soda",
      "Energia",
      "Distribuição de Energia",
      "Águas",
      "Desaguamento",
      "Efluentes",
    ],
  },
  {
    label: "Manutenção e Apoio",
    areas: [
      "Facilidades de Manutenção",
      "Oficina Mecânica",
      "Oficina Elétrica",
      "Oficina de Instrumentação",
      "Almoxarifado Central",
      "Laboratório",
      "Sala de Controle Central",
      "Administração Central",
    ],
  },
  {
    label: "Logística e Externo",
    areas: [
      "Terminal Portuário",
      "Logística",
      "Acordos Públicos / Áreas Externas",
    ],
  },
  {
    label: "Florestal",
    areas: ["Florestal", "Hortos Florestais"],
  },
]

/** Lista plana de todas as áreas (para validação / geração de exemplos). */
export const CMPC_AREAS_FLAT: string[] = CMPC_AREA_GROUPS.flatMap((g) => g.areas)

/** Plantas da CMPC Guaíba. */
export const CMPC_PLANTS: string[] = ["G1", "G2", "Áreas Comuns"]
