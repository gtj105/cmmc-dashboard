import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

const riskStyles: Record<RiskLevel, string> = {
  'Low': 'bg-zinc-900/80 text-zinc-300 border-zinc-800',
  'Medium': 'bg-amber-950/40 text-amber-300 border-amber-900/70',
  'High': 'bg-orange-950/40 text-orange-300 border-orange-900/70',
  'Critical': 'bg-red-950/40 text-red-300 border-red-900/70',
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        riskStyles[risk]
      )}
    >
      {risk}
    </span>
  )
}
