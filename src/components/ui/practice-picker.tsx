'use client'

import { useEffect, useRef, useState } from 'react'
import { PRACTICE_DOMAINS } from '@/lib/practice-data'

interface PracticePickerProps {
  value: string
  onChange: (_value: string) => void
}

export function PracticePicker({ value, onChange }: PracticePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState(PRACTICE_DOMAINS[0].abbr)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const domain = PRACTICE_DOMAINS.find(d => d.abbr === selectedDomain) ?? PRACTICE_DOMAINS[0]

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Practice ID"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title="Browse practices"
          className="shrink-0 border border-border/70 bg-background px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      {/* Two-panel dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex border border-border bg-card shadow-lg" style={{ width: '480px' }}>
          {/* Left: domain list */}
          <div className="w-32 shrink-0 border-r border-border">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Domain
            </div>
            <div className="max-h-72 overflow-y-auto">
              {PRACTICE_DOMAINS.map(d => (
                <button
                  key={d.abbr}
                  type="button"
                  onClick={() => setSelectedDomain(d.abbr)}
                  className={[
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                    selectedDomain === d.abbr
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  ].join(' ')}
                >
                  <span className="w-8 shrink-0 font-mono font-semibold">{d.abbr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: practice list */}
          <div className="flex-1 min-w-0">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {domain.name}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {domain.practices.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onChange(p.id); setOpen(false) }}
                  className={[
                    'flex w-full items-start gap-3 px-3 py-2 text-left transition-colors',
                    value === p.id
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-accent/50',
                  ].join(' ')}
                >
                  <span className="w-28 shrink-0 font-mono text-[11px] text-muted-foreground">{p.id}</span>
                  <span className="text-xs text-foreground leading-snug">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
