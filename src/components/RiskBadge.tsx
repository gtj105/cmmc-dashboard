import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

const riskStyles: Record<RiskLevel, string> = {
  'Low': 'bg-zinc-800 text-zinc-400 border-zinc-700',
  'Medium': 'bg-amber-900/40 text-amber-400 border-amber-700/50',
  'High': 'bg-orange-900/40 text-orange-400 border-orange-700/50',
  'Critical': 'bg-red-900/40 text-red-400 border-red-700/50',
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        riskStyles[risk]
      )}
    >
      {risk}
    </span>
  )
}
