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

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <div
        className="text-xs mb-2"
        style={{
          color: '#7C7369',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
        }}
      >
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 mb-1 text-xs"
          style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ background: p.color }}
          />
          <span style={{ color: '#7C7369' }}>{p.name}:</span>
          <span
            style={{
              color: '#1A1714',
              fontFamily: 'var(--font-berkeley-mono), JetBrains Mono, monospace',
              fontWeight: 600,
            }}
          >
            {formatTokens(p.value)}
          </span>
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
        <div key={p.value} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: p.color }}
          />
          <span
            className="text-xs"
            style={{
              color: '#7C7369',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
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
          stroke="#EDE9E4"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: '#7C7369', fontSize: 10, fontFamily: 'sans-serif' }}
          axisLine={{ stroke: '#EDE9E4' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#7C7369', fontSize: 10, fontFamily: 'sans-serif' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatTokens(v)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217,119,87,0.04)' }} />
        <Legend content={<CustomLegend />} />
        {/* 3 warm shades of orange */}
        <Bar dataKey="Cache Read" stackId="a" fill="#F5E8E1" />
        <Bar dataKey="Cache Create" stackId="a" fill="#F5B896" />
        <Bar dataKey="I/O" stackId="a" fill="#D97757" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
