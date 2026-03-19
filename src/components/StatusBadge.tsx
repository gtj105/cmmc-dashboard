import { cn } from '@/lib/utils'
import type { Status } from '@/lib/types'

const statusStyles: Record<Status, string> = {
  'Not Started': 'bg-zinc-800 text-zinc-400 border-zinc-700',
  'In Progress': 'bg-amber-900/40 text-amber-400 border-amber-700/50',
  'Implemented': 'bg-blue-900/40 text-blue-400 border-blue-700/50',
  'Audit Ready': 'bg-green-900/40 text-green-400 border-green-700/50',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {status}
    </span>
  )
}
