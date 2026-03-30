'use client'

import { useState } from 'react'

export function CustomerActions({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  const isLong = paragraphs.length > 2
  const displayParagraphs = isLong && !expanded ? paragraphs.slice(0, 2) : paragraphs

  return (
    <div className="space-y-2.5 text-xs text-foreground">
      {displayParagraphs.map((para, i) => {
        const lines = para.split('\n').map(l => l.trim()).filter(Boolean)
        const firstLine = lines[0]
        const isSection = lines.length > 1 && lines.slice(1).every(l => /^[•\-\*]/.test(l.trim()))

        if (isSection) {
          const bullets = lines.slice(1)
          return (
            <div key={i} className="space-y-1">
              <p className="font-semibold text-foreground/90">{firstLine}</p>
              <ul className="space-y-0.5 pl-2">
                {bullets.map((line, j) => (
                  <li key={j} className="flex gap-1.5 text-foreground/80">
                    <span className="mt-px shrink-0 text-muted-foreground">•</span>
                    <span>{line.replace(/^[•\-]\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        return <p key={i} className="leading-relaxed text-foreground/80">{para}</p>
      })}
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          {expanded ? 'Show less' : 'Show more…'}
        </button>
      )}
    </div>
  )
}
