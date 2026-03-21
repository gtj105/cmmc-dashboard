import type { RiskLevel } from '@/lib/types'

export function ragTextClass(pct: number): string {
  if (pct >= 80) return 'text-green-300'
  if (pct >= 40) return 'text-amber-300'
  return 'text-red-300'
}

export function ragBorderClass(pct: number): string {
  if (pct >= 80) return 'border-emerald-800/50'
  if (pct >= 40) return 'border-amber-800/50'
  return 'border-red-900/60'
}

export function ragPanelClass(pct: number): string {
  if (pct >= 80) return 'border-emerald-950/60 bg-emerald-950/10'
  if (pct >= 40) return 'border-amber-950/70 bg-amber-950/10'
  return 'border-red-950/80 bg-red-950/20'
}

export function riskColorMap(): Record<RiskLevel, string> {
  return {
    Critical: 'text-red-300 bg-red-950/30 border-red-950/80',
    High:     'text-orange-300 bg-orange-950/30 border-orange-950/80',
    Medium:   'text-amber-300 bg-amber-950/30 border-amber-950/80',
    Low:      'text-zinc-300 bg-zinc-900/60 border-zinc-800',
  }
}
