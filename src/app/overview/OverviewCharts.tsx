'use client'

import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(25 10% 8%)',
  border: '1px solid hsl(25 8% 16%)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'hsl(30 15% 90%)',
}

const RANGES = ['1d', '1w', '1m', '3m', '6m', '1y'] as const
type Range = typeof RANGES[number]

interface BurndownPoint { week: string; open: number; closed: number }

interface DomainPoint {
  abbreviation: string
  name: string
  completion_pct: number
}

interface OverviewChartsProps {
  initialBurndown: BurndownPoint[]
  domains: DomainPoint[]
}

export default function OverviewCharts({ initialBurndown, domains }: OverviewChartsProps) {
  const [range, setRange] = useState<Range>('3m')
  const [burndownData, setBurndownData] = useState<BurndownPoint[]>(initialBurndown)
  const [loading, setLoading] = useState(false)
  const initialMount = useRef(true)

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/burndown?range=${range}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setBurndownData(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [range])

  const radarData = [...domains]
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
    .map((d) => ({ subject: d.abbreviation, value: d.completion_pct, fullName: d.name }))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* Burndown */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Remediation Burndown
          </p>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={[
                  'rounded-sm px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors',
                  r === range
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60',
                ].join(' ')}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className={loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={burndownData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(25 8% 16%)" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'hsl(25 6% 55%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(25 8% 16%)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(25 6% 55%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'hsl(25 6% 55%)' }} />
              <Line
                type="monotone"
                dataKey="open"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Open"
                animationDuration={600}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Closed"
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain radar */}
      <div className="border-l border-border pl-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Domain Radar
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="hsl(25 8% 18%)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'hsl(25 6% 52%)', fontSize: 10, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'hsl(25 6% 38%)', fontSize: 9 }}
              tickCount={3}
              axisLine={false}
            />
            <Radar
              dataKey="value"
              stroke="hsl(38 92% 50% / 0.7)"
              fill="hsl(38 92% 50% / 0.08)"
              strokeWidth={1.5}
              animationDuration={700}
              animationEasing="ease-out"
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [
                `${value}%`,
                props.payload?.fullName ?? 'Coverage',
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
