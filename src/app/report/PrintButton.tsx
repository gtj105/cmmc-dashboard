'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="border border-border/70 bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.14em] text-foreground hover:bg-card/60"
    >
      Print / Save as PDF
    </button>
  )
}
