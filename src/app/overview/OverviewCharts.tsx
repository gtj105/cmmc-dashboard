'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(224 71% 6%)',
  border: '1px solid hsl(216 34% 17%)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'hsl(213 31% 91%)',
}

interface OverviewChartsProps {
  burndownData: Array<{ week: string; open: number; closed: number }>
  radarData: Array<{ domain: string; pct: number }>
}

export default function OverviewCharts({ burndownData, radarData }: OverviewChartsProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Burndown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Remediation Burndown (90 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={burndownData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'hsl(215.4 16.3% 56.9%)', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(216 34% 17%)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(215.4 16.3% 56.9%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'hsl(215.4 16.3% 56.9%)' }}
              />
              <Line
                type="monotone"
                dataKey="open"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Open"
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Closed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Domain Completion Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
              <PolarGrid stroke="hsl(216 34% 17%)" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fill: 'hsl(215.4 16.3% 56.9%)', fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'hsl(215.4 16.3% 56.9%)', fontSize: 9 }}
              />
              <Radar
                name="Completion %"
                dataKey="pct"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, 'Completion']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
