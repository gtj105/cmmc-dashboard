import { cn } from '@/lib/utils'
import type { Framework } from '@/lib/types'

const frameworkStyles: Record<Framework, string> = {
  'CMMC': 'bg-stone-900/80 text-stone-200 border-stone-800',
  'ITAR': 'bg-amber-950/20 text-amber-200 border-amber-950/70',
}

export function FrameworkBadge({ framework }: { framework: Framework }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        frameworkStyles[framework]
      )}
    >
      {framework}
    </span>
  )
}
