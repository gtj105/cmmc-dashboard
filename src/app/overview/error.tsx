'use client'

export default function OverviewError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Overview</p>
      <p className="text-sm text-foreground">{error.message || 'Failed to load overview data.'}</p>
      <button onClick={reset} className="text-xs text-sky-300 hover:text-sky-200">
        Try again
      </button>
    </div>
  )
}
