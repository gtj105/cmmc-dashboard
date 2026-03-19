import { cn } from '@/lib/utils'
import type { Framework } from '@/lib/types'

const frameworkStyles: Record<Framework, string> = {
  'CMMC': 'bg-blue-900/40 text-blue-400 border-blue-700/50',
  'ITAR': 'bg-purple-900/40 text-purple-400 border-purple-700/50',
}

export function FrameworkBadge({ framework }: { framework: Framework }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        frameworkStyles[framework]
      )}
    >
      {framework}
    </span>
  )
}
