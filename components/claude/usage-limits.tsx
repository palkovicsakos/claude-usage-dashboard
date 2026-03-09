'use client'

import type { UsageLimits } from '@/lib/types'
import { formatTokens } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

interface UsageLimitsProps {
  usage: UsageLimits
  lang?: Lang
}

function UsageBar({ label, pct, tokens, peak, subtitle, color }: { label: string; pct: number; tokens: number; peak: number; subtitle: string; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: '#1A1714', fontFamily: 'inherit' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color, fontFamily: 'inherit' }}>{pct}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden mb-1" style={{ height: 6, background: '#EDE9E4' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#B0A9A1', fontFamily: 'inherit' }}>{subtitle}</span>
        <span className="text-xs" style={{ color: '#B0A9A1', fontFamily: 'inherit' }}>{formatTokens(tokens)} / {formatTokens(peak)} peak</span>
      </div>
    </div>
  )
}

export function UsageLimitsDisplay({ usage, lang = 'en' }: UsageLimitsProps) {
  const t = T[lang]

  function barColor(pct: number): string {
    if (pct >= 80) return '#A84F31'
    if (pct >= 50) return '#C96442'
    return '#E8917A'
  }

  return (
    <div>
      <UsageBar label={t.sessionLabel} pct={usage.session_pct} tokens={usage.session_tokens} peak={usage.peak_day_tokens} subtitle={t.sessionSub} color={barColor(usage.session_pct)} />
      <UsageBar label={t.weekAllLabel} pct={usage.week_pct} tokens={usage.week_tokens} peak={usage.peak_week_tokens} subtitle={`${t.resets} ${usage.week_reset}`} color={barColor(usage.week_pct)} />
      <UsageBar label={t.weekSonnetLabel} pct={usage.week_sonnet_pct} tokens={usage.week_sonnet_tokens} peak={usage.peak_week_tokens} subtitle={`${t.resets} ${usage.week_reset}`} color={barColor(usage.week_sonnet_pct)} />
      <div className="mt-3 pt-3 text-xs" style={{ color: '#B0A9A1', borderTop: '1px solid #EDE9E4', fontFamily: 'inherit' }}>
        {t.usageFooter}
      </div>
    </div>
  )
}
