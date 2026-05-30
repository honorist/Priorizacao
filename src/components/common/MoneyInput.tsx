import { Input } from "@/components/ui/input"

/** Formata um número com separador de milhar pt-BR (1.000.000), sem casas decimais. */
function formatGroup(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
}

interface MoneyInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "type"
  > {
  value: number | undefined
  onValueChange: (value: number | undefined) => void
  /** Permite valores negativos (ex.: VPL). */
  allowNegative?: boolean
}

/**
 * Input de dinheiro que mostra o separador de milhar à medida que se digita.
 * Internamente é um campo de texto; emite um `number | undefined`.
 */
export function MoneyInput({
  value,
  onValueChange,
  allowNegative = false,
  ...props
}: MoneyInputProps) {
  const display = value == null || Number.isNaN(value) ? "" : formatGroup(value)

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => {
        const raw = e.target.value
        const neg = allowNegative && raw.trim().startsWith("-")
        const digits = raw.replace(/\D/g, "")
        if (digits === "") {
          onValueChange(undefined)
          return
        }
        onValueChange(Number(digits) * (neg ? -1 : 1))
      }}
      {...props}
    />
  )
}
