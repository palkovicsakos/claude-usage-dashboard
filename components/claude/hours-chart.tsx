'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DayStats } from '@/lib/types'
import { formatShortDate } from '@/lib/utils-stats'

interface HoursChartProps {
  days: DayStats[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const minutes = payload[0].value
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'inherit' }}>
      <div style={{ color: '#7C7369', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#C96442', fontWeight: 600 }}>{h}h {m}m active</div>
    </div>
  )
}

export function HoursChart({ days }: HoursChartProps) {
  const data = days.map((d) => ({
    date: formatShortDate(d.date),
    minutes: d.hours.active_minutes,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="hoursGradClaude" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C96442" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#C96442" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,100,66,0.05)' }} />
        <Bar dataKey="minutes" fill="url(#hoursGradClaude)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
