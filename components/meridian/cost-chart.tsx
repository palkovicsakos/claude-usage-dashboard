'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { type DayStats } from '@/lib/types'
import { formatCost, formatShortDate } from '@/lib/utils-stats'

interface CostChartProps {
  days: DayStats[]
}

interface TooltipPayloadEntry {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-[#0F172A] text-white px-3 py-2 rounded-lg shadow-lg text-xs">
      <p className="text-[#94A3B8] mb-1">{label}</p>
      <p className="font-mono font-semibold text-sm">{formatCost(payload[0].value)}</p>
    </div>
  )
}

export function CostChart({ days }: CostChartProps) {
  const data = days.map((d) => ({
    date: formatShortDate(d.date),
    cost: d.cost,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#F1F5F9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-geist-mono)' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
          tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'var(--font-geist-mono)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
        <Bar
          dataKey="cost"
          fill="#2563EB"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
