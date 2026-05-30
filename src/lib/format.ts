/** Formatadores em pt-BR. */

export function fmtNum(n: number, max = 2): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: max })
}

export function fmtPct(n: number): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`
}

/** Formata valores monetários — sempre em US$. */
export function fmtCapex(n?: number): string {
  if (n == null || Number.isNaN(n)) return "—"
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

/** Alias semântico para qualquer valor em dinheiro (US$). */
export const fmtMoney = fmtCapex
