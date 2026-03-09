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
import { formatShortDate } from '@/lib/utils-stats'

interface HoursChartProps {
  days: DayStats[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const mins = payload[0].value
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return (
    <div
      className="rounded-sm px-3 py-2 text-xs font-mono"
      style={{ background: '#0D0D14', border: '1px solid rgba(0,212,255,0.33)' }}
    >
      <div style={{ color: '#4A5568', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#00D4FF', fontWeight: 700 }}>
        {h > 0 ? `${h}h ` : ''}{m}m
      </div>
    </div>
  )
}

export function HoursChart({ days }: HoursChartProps) {
  const data = days
    .filter((d) => d.hours.active_minutes > 0)
    .map((d) => ({
      date: formatShortDate(d.date),
      minutes: d.hours.active_minutes,
    }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.3} />
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
          tickFormatter={(v) => `${Math.floor(v / 60)}h`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="minutes" fill="url(#hoursGradient)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
