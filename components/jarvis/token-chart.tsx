'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate, formatTokens } from '@/lib/utils-stats'

interface TokenChartProps {
  days: DayStats[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-sm px-3 py-2 text-xs font-mono"
      style={{
        background: '#0D0D14',
        border: '1px solid rgba(0, 212, 255, 0.33)',
      }}
    >
      <div style={{ color: '#4A5568', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span style={{ color: '#E8EDF5' }}>{formatTokens(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null
  return (
    <div className="flex gap-4 justify-center mt-1">
      {payload.map((p) => (
        <div key={p.value} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-xs" style={{ color: '#4A5568', fontFamily: 'monospace' }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TokenChart({ days }: TokenChartProps) {
  const data = days
    .filter((d) => d.tokens.total > 0)
    .map((d) => ({
      date: formatShortDate(d.date),
      'Cache Read': d.tokens.cache_read,
      'Cache Create': d.tokens.cache_create,
      'I/O': d.tokens.input + d.tokens.output,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
        />
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
          tickFormatter={(v) => formatTokens(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        <Bar dataKey="Cache Read" stackId="a" fill="rgba(0, 212, 255, 0.2)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Cache Create" stackId="a" fill="rgba(121, 40, 202, 0.53)" />
        <Bar dataKey="I/O" stackId="a" fill="#00D4FF" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
