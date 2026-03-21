import { cn } from '@/lib/utils'
import type { Status } from '@/lib/types'

const statusStyles: Record<Status, string> = {
  'Not Started': 'bg-zinc-900/80 text-zinc-300 border-zinc-800',
  'In Progress': 'bg-amber-950/40 text-amber-300 border-amber-900/70',
  'Implemented': 'bg-stone-900/80 text-stone-200 border-stone-800',
  'Audit Ready': 'bg-green-950/30 text-green-300 border-green-900/70',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        statusStyles[status]
      )}
    >
      {status}
    </span>
  )
}
