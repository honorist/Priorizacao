import { cn } from "@/lib/utils"
import type { Band } from "@/lib/types"

/** Bolinha colorida do tema. */
export function ThemeDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  )
}

/** Etiqueta colorida da faixa (Baixa/Média/Alta). */
export function BandBadge({ band, className }: { band?: Band; className?: string }) {
  if (!band) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: band.color }}
    >
      {band.label}
    </span>
  )
}
