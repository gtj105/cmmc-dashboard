'use client'

export default function OverlaysError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Overlays</p>
      <p className="text-sm text-foreground">{error.message || 'Failed to load overlay data.'}</p>
      <button onClick={reset} className="text-xs text-sky-300 hover:text-sky-200">
        Try again
      </button>
    </div>
  )
}
