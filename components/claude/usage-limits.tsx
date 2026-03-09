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

  function formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return Math.round(n / 1_000) + 'K'
    return String(n)
  }

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

      {/* Stats from /usage cache */}
      {(usage.total_messages != null || usage.total_sessions_cache != null) && (
        <div className="mt-4 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid #EDE9E4' }}>
          {usage.total_messages != null && (
            <div>
              <div className="text-xs mb-0.5" style={{ color: '#B0A9A1', fontFamily: 'inherit' }}>Total messages</div>
              <div className="text-sm font-semibold" style={{ color: '#C96442', fontFamily: 'inherit' }}>{formatNum(usage.total_messages)}</div>
            </div>
          )}
          {usage.total_sessions_cache != null && (
            <div>
              <div className="text-xs mb-0.5" style={{ color: '#B0A9A1', fontFamily: 'inherit' }}>Total sessions</div>
              <div className="text-sm font-semibold" style={{ color: '#1A1714', fontFamily: 'inherit' }}>{formatNum(usage.total_sessions_cache)}</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 text-xs" style={{ color: '#B0A9A1', borderTop: '1px solid #EDE9E4', fontFamily: 'inherit' }}>
        {t.usageFooter}
      </div>
    </div>
  )
}
