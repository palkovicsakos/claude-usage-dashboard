'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate, formatTokens } from '@/lib/utils-stats'

interface SessionsChartProps {
  days: DayStats[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-sm px-3 py-2 text-xs font-mono"
      style={{ background: '#0D0D14', border: '1px solid rgba(0,212,255,0.33)' }}
    >
      <div style={{ color: '#4A5568', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span style={{ color: '#E8EDF5' }}>
            {p.name === 'Sessions' ? p.value : formatTokens(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SessionsChart({ days }: SessionsChartProps) {
  const data = days
    .filter((d) => d.sessions > 0)
    .map((d) => ({
      date: formatShortDate(d.date),
      Sessions: d.sessions,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7928CA" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7928CA" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Sessions" fill="url(#sessionsGradient)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
