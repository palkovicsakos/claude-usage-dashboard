'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate } from '@/lib/utils-stats'

interface CostChartProps {
  days: DayStats[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-sm px-3 py-2 text-xs font-mono"
      style={{
        background: '#0D0D14',
        border: '1px solid rgba(245, 158, 11, 0.33)',
        color: '#F59E0B',
      }}
    >
      <div style={{ color: '#4A5568', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#F59E0B', fontWeight: 700 }}>
        ${payload[0].value.toFixed(2)}
      </div>
    </div>
  )
}

export function CostChart({ days }: CostChartProps) {
  const data = days
    .filter((d) => d.cost > 0)
    .map((d) => ({
      date: formatShortDate(d.date),
      cost: d.cost,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#F59E0B"
          strokeWidth={2}
          fill="url(#costGradient)"
          dot={false}
          activeDot={{
            r: 4,
            fill: '#F59E0B',
            stroke: '#0D0D14',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
