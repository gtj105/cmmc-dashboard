'use client'

import { useEffect, useRef } from 'react'

interface ComplianceGaugeProps {
  cmmc: number
  sprs: number
  baselineSprs?: number | null
  hasBaseline: boolean
}

const R = 75
const CX = 100
const CY = 100
const SW = 11
const CIRC = 2 * Math.PI * R            // 471.24
const SWEEP_DEG = 270
const SWEEP_LEN = (SWEEP_DEG / 360) * CIRC  // 353.43
const START = 135                        // SVG angle: 135° from right = ~7:30 o'clock

function ragHex(pct: number) {
  if (pct >= 80) return '#4ade80'  // green-400
  if (pct >= 40) return '#fbbf24'  // amber-400
  return '#f87171'                  // red-400
}

function sprsHex(score: number) {
  if (score >= 80) return '#86efac'  // green-300
  if (score >= 0)  return '#fcd34d'  // amber-300
  return '#fca5a5'                    // red-300
}

export default function ComplianceGauge({ cmmc, sprs, baselineSprs, hasBaseline }: ComplianceGaugeProps) {
  const fillRef = useRef<SVGCircleElement>(null)
  const fillLen = (cmmc / 100) * SWEEP_LEN
  const color = ragHex(cmmc)

  useEffect(() => {
    const el = fillRef.current
    if (!el) return
    el.style.strokeDasharray = `0 ${CIRC}`
    el.style.transition = 'none'
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)'
        el.style.strokeDasharray = `${fillLen} ${CIRC}`
      })
    })
    return () => cancelAnimationFrame(id)
  }, [fillLen])

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width="196" height="196" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#38bdf8" />
            <stop offset="100%" stopColor={color}   />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={SW}
          strokeDasharray={`${SWEEP_LEN} ${CIRC}`}
          strokeLinecap="round"
          transform={`rotate(${START} ${CX} ${CY})`}
        />

        {/* Fill */}
        <circle
          ref={fillRef}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="url(#gauge-fill)"
          strokeWidth={SW}
          strokeDasharray={`${fillLen} ${CIRC}`}
          strokeLinecap="round"
          transform={`rotate(${START} ${CX} ${CY})`}
          style={{ strokeDasharray: `${fillLen} ${CIRC}` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="text-[2.6rem] font-semibold tabular-nums" style={{ color }}>
            {cmmc}
          </span>
          <span className="text-xl text-muted-foreground font-normal">%</span>
        </div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
          CMMC Level 2
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Current SPRS{' '}
          <span className="font-semibold tabular-nums" style={{ color: sprsHex(sprs) }}>
            {sprs}
          </span>
        </p>
        {hasBaseline && baselineSprs != null && baselineSprs !== sprs && (
          <p className="mt-0.5 text-[10px] text-muted-foreground/50 tabular-nums">
            Baseline {baselineSprs}
          </p>
        )}
      </div>
    </div>
  )
}
