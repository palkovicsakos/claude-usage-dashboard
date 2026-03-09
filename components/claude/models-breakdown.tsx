'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DayStats, ModelTokens } from '@/lib/types'
import { formatShortDate, formatTokens } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

interface ModelsBreakdownProps {
  days: DayStats[]
  modelBreakdown: Record<string, ModelTokens>
  lang?: Lang
}

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-6': '#C96442',
  'claude-sonnet-4-5-20250929': '#D97057',
  'claude-opus-4-6': '#A84F31',
  'claude-haiku-4-5-20251001': '#E8917A',
}

function getModelColor(model: string): string {
  return MODEL_COLORS[model] ?? '#B0A9A1'
}

function shortModelName(model: string): string {
  return model.replace('claude-', '').replace(/-\d{8}$/, '').replace('-20250929', '')
}

export function ModelsBreakdown({ days, modelBreakdown, lang = 'en' }: ModelsBreakdownProps) {
  const t = T[lang]
  const models = Object.keys(modelBreakdown).filter(m => m !== '<synthetic>' && modelBreakdown[m].total > 0)

  const data = days.map((d) => {
    const row: Record<string, number | string> = { date: formatShortDate(d.date) }
    for (const model of models) row[shortModelName(model)] = d.model_tokens?.[model]?.total ?? 0
    return row
  })

  const total = models.reduce((s, m) => s + (modelBreakdown[m]?.total ?? 0), 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#B0A9A1', fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #EDE9E4', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#7C7369', marginBottom: 4, fontFamily: 'inherit' }}
          />
          {models.map((model) => (
            <Line key={model} type="monotone" dataKey={shortModelName(model)} stroke={getModelColor(model)} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(models.length, 3)}, 1fr)` }}>
        {models.map((model) => {
          const mb = modelBreakdown[model]
          const pct = total > 0 ? Math.round((mb.total / total) * 100) : 0
          return (
            <div key={model} className="rounded-lg p-3" style={{ background: '#FAF9F6', border: '1px solid #EDE9E4' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: getModelColor(model), flexShrink: 0 }} />
                <span className="text-xs font-medium truncate" style={{ color: '#1A1714', fontFamily: 'inherit' }}>{shortModelName(model)}</span>
              </div>
              <div className="text-xs" style={{ color: '#7C7369', fontFamily: 'inherit' }}>
                {t.inLabel}/{t.outLabel}: {formatTokens(mb.input + mb.output)} · {pct}%
              </div>
              {mb.cost && (
                <div className="text-xs font-semibold mt-0.5" style={{ color: '#C96442' }}>${mb.cost.toFixed(2)}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
