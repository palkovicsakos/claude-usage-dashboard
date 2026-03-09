'use client'

import type { HoursBreakdown } from '@/lib/types'
import { formatMinutes } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

interface HoursDisplayProps {
  hours: HoursBreakdown
  lang?: Lang
}

function HoursRow({ label, minutes, maxMinutes, barColor, trackColor, valueColor }: { label: string; minutes: number; maxMinutes: number; barColor: string; trackColor: string; valueColor?: string }) {
  const pct = maxMinutes > 0 ? Math.min((minutes / maxMinutes) * 100, 100) : 0
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm italic" style={{ color: '#7C7369', fontFamily: 'var(--font-lora), Georgia, serif' }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: valueColor ?? '#1A1714', fontFamily: 'var(--font-jb-mono), JetBrains Mono, monospace' }}>{formatMinutes(minutes)}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: trackColor }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  )
}

export function HoursDisplay({ hours, lang = 'en' }: HoursDisplayProps) {
  const t = T[lang]
  const { active_minutes, span_minutes, idle_minutes } = hours
  const max = span_minutes
  const activeRatio = span_minutes > 0 ? (active_minutes / span_minutes) * 100 : 0

  return (
    <div>
      <HoursRow label={t.active} minutes={active_minutes} maxMinutes={max} barColor="#D97757" trackColor="rgba(217,119,87,0.12)" valueColor="#D97757" />
      <HoursRow label={t.spanLabel} minutes={span_minutes} maxMinutes={max} barColor="#C4B5A0" trackColor="rgba(196,181,160,0.2)" />
      <HoursRow label={t.idle} minutes={idle_minutes} maxMinutes={max} barColor="#EDE9E4" trackColor="rgba(237,233,228,0.6)" />

      <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #EDE9E4' }}>
        <span className="text-xs" style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>{t.efficiency}</span>
        <div className="flex items-center gap-3">
          <div className="rounded-full overflow-hidden" style={{ width: 72, height: 5, background: '#F5E8E1' }}>
            <div className="h-full rounded-full" style={{ width: `${activeRatio.toFixed(0)}%`, background: 'linear-gradient(90deg, #F5B896, #D97757)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#D97757', fontFamily: 'var(--font-jb-mono), JetBrains Mono, monospace' }}>{activeRatio.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}
