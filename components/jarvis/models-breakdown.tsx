'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DayStats, ModelTokens } from '@/lib/types'
import { formatShortDate, formatTokens } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

interface ModelsBreakdownProps {
  days: DayStats[]
  modelBreakdown: Record<string, ModelTokens>
  lang?: Lang
}

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-6': '#00D4FF',
  'claude-opus-4-6': '#7928CA',
  'claude-haiku-4-5': '#F0A500',
}

function getModelColor(model: string): string {
  return MODEL_COLORS[model] || '#4A5568'
}

function shortModelName(model: string): string {
  return model.replace('claude-', '').replace('-20251001', '').replace('-20240620', '').replace('-20250929', '')
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm px-3 py-2 text-xs font-mono" style={{ background: '#0D0D14', border: '1px solid rgba(0,212,255,0.33)' }}>
      <div style={{ color: '#4A5568', marginBottom: 4 }}>{label}</div>
      {payload.filter(p => p.value > 0).map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span style={{ color: p.color }}>{shortModelName(p.name)}:</span>
          <span style={{ color: '#E8EDF5' }}>{formatTokens(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null
  return (
    <div className="flex gap-4 justify-center mt-1 flex-wrap">
      {payload.map((p) => (
        <div key={p.value} className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-xs" style={{ color: '#4A5568', fontFamily: 'monospace' }}>{shortModelName(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ModelsBreakdown({ days, modelBreakdown, lang = 'en' }: ModelsBreakdownProps) {
  const t = T[lang]
  const models = Object.keys(modelBreakdown).filter(m => m !== '<synthetic>').sort((a, b) => (modelBreakdown[b].total || 0) - (modelBreakdown[a].total || 0))

  const chartData = days.filter(d => d.tokens.total > 0).map(d => {
    const point: Record<string, number | string> = { date: formatShortDate(d.date) }
    for (const model of models) point[model] = d.model_tokens?.[model]?.total || 0
    return point
  })

  const totalAllModels = Object.values(modelBreakdown).reduce((s, m) => s + m.total, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
          <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatTokens(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {models.map(model => (
            <Line key={model} type="monotone" dataKey={model} stroke={getModelColor(model)} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: getModelColor(model) }} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {models.map(model => {
          const m = modelBreakdown[model]
          const pct = totalAllModels > 0 ? Math.round((m.total / totalAllModels) * 1000) / 10 : 0
          return (
            <div key={model}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getModelColor(model), boxShadow: `0 0 4px ${getModelColor(model)}66` }} />
                <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>
                  {shortModelName(model)} <span style={{ color: '#4A5568' }}>({pct}%)</span>
                </span>
              </div>
              <div className="text-xs font-mono ml-4" style={{ color: '#4A5568' }}>
                {t.inLabel}: {formatTokens(m.input)} · {t.outLabel}: {formatTokens(m.output)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
