'use client'

import { useState, useEffect, useMemo } from 'react'
import { Lora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import type { StatsData, PeriodStats, DayStats } from '@/lib/types'
import { formatCost, formatTokens, formatMinutes } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'
import { MetricCard } from '@/components/claude/metric-card'
import { CostChart } from '@/components/claude/cost-chart'
import { TokenChart } from '@/components/claude/token-chart'
import { HoursChart } from '@/components/claude/hours-chart'
import { SessionsChart } from '@/components/claude/sessions-chart'
import { HoursDisplay } from '@/components/claude/hours-display'
import { ProjectTable } from '@/components/claude/project-table'
import { ActivityHeatmap } from '@/components/claude/activity-heatmap'
import { ModelsBreakdown } from '@/components/claude/models-breakdown'
import { UsageLimitsDisplay } from '@/components/claude/usage-limits'

const lora = Lora({ weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-lora' })
const plusJakarta = Plus_Jakarta_Sans({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-plus-jakarta' })
const jetbrainsMono = JetBrains_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-jb-mono' })

type Period = 'today' | 'daily' | 'weekly' | 'monthly' | 'all_time' | 'custom'

const PRESET_PERIODS: Exclude<Period, 'custom'>[] = ['today', 'daily', 'weekly', 'monthly', 'all_time']

function buildPeriodFromDays(days: DayStats[]): PeriodStats {
  return days.reduce(
    (acc, d) => {
      acc.cost += d.cost
      acc.tokens.input += d.tokens.input
      acc.tokens.output += d.tokens.output
      acc.tokens.cache_create += d.tokens.cache_create
      acc.tokens.cache_read += d.tokens.cache_read
      acc.tokens.total += d.tokens.total
      acc.hours.active_minutes += d.hours.active_minutes
      acc.hours.span_minutes += d.hours.span_minutes
      acc.hours.idle_minutes += d.hours.idle_minutes
      acc.sessions += d.sessions
      return acc
    },
    { cost: 0, cost_delta: null, tokens: { input: 0, output: 0, cache_create: 0, cache_read: 0, total: 0 }, hours: { active_minutes: 0, span_minutes: 0, idle_minutes: 0 }, sessions: 0, days: [] }
  )
}

export default function ClaudePage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [period, setPeriod] = useState<Period>('daily')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')
  const [lang, setLang] = useState<Lang>('en')

  const t = T[lang]
  const PERIOD_LABELS: Record<Exclude<Period, 'custom'>, string> = { today: t.today, daily: t.daily, weekly: t.weekly, monthly: t.monthly, all_time: t.allTime }

  async function loadStats() {
    const res = await fetch('/api/stats', { cache: 'no-store' })
    setStats(await res.json())
  }

  useEffect(() => { loadStats() }, [])

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg('')
    try {
      await fetch('/api/refresh', { method: 'POST' })
      await loadStats()
      setRefreshMsg('done')
      setTimeout(() => setRefreshMsg(''), 3000)
    } finally {
      setRefreshing(false)
    }
  }

  const data: PeriodStats | null = useMemo(() => {
    if (!stats) return null
    if (period === 'custom') {
      if (!customStart || !customEnd) return stats.daily
      const filtered = stats.all_time.days.filter((d) => d.date >= customStart && d.date <= customEnd)
      return buildPeriodFromDays(filtered)
    }
    return stats[period]
  }, [stats, period, customStart, customEnd])

  if (!stats || !data) {
    return (
      <div className={`${lora.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} min-h-screen flex items-center justify-center`}
        style={{ background: '#FAF9F6', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
        <div className="text-center">
          <div className="text-3xl mb-3" style={{ color: '#C96442' }}>⬡</div>
          <div className="text-sm" style={{ color: '#B0A9A1' }}>{t.loading}</div>
        </div>
      </div>
    )
  }

  const favoriteModel = stats.model_breakdown
    ? Object.entries(stats.model_breakdown).filter(([k]) => k !== '<synthetic>').sort((a, b) => b[1].total - a[1].total)[0]?.[0] ?? ''
    : ''
  const totalTokensAllTime = stats.all_time?.tokens?.total ?? 0
  const activeDaysAllTime = stats.all_time?.days?.filter((d) => d.cost > 0).length ?? 0

  return (
    <div
      className={`${lora.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} min-h-screen`}
      style={{ background: '#FAF9F6', fontFamily: 'var(--font-plus-jakarta), sans-serif', color: '#1A1714' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #A84F31 0%, #E8917A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(201,100,66,0.25)',
              fontSize: 18, flexShrink: 0, color: '#fff',
            }}>
              ⬡
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: 'var(--font-lora), Georgia, serif', color: '#1A1714', letterSpacing: '-0.01em' }}>
                {t.claudeTitle}
              </h1>
              <p className="text-xs" style={{ color: '#B0A9A1' }}>{t.usageIntelligence} · {t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: refreshing ? 'rgba(201,100,66,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: refreshing ? 'rgba(201,100,66,0.3)' : '#EDE9E4',
                color: refreshing ? '#C96442' : '#7C7369',
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!refreshing) { e.currentTarget.style.borderColor = 'rgba(201,100,66,0.4)'; e.currentTarget.style.color = '#C96442' } }}
              onMouseLeave={(e) => { if (!refreshing) { e.currentTarget.style.borderColor = '#EDE9E4'; e.currentTarget.style.color = '#7C7369' } }}
            >
              {refreshing ? t.refreshing : refreshMsg ? t.refreshed : t.refresh}
            </button>
            <button
              onClick={() => setLang(l => l === 'en' ? 'hu' : 'en')}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
              style={{ background: 'rgba(201,100,66,0.08)', color: '#C96442', border: '1px solid rgba(201,100,66,0.25)', cursor: 'pointer' }}
            >
              {lang === 'en' ? 'HU' : 'EN'}
            </button>
            <Link href="/jarvis"
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
              style={{ background: 'rgba(0,0,0,0.04)', color: '#7C7369', border: '1px solid rgba(0,0,0,0.07)', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1714'; e.currentTarget.style.color = '#FAF9F6'; e.currentTarget.style.borderColor = '#1A1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#7C7369'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)' }}
            >
              ⇄ {t.jarvis.toUpperCase()}
            </Link>
          </div>
        </div>

        {/* ── Separator ── */}
        <div className="w-full mb-6" style={{ height: 1, background: 'linear-gradient(90deg, #C96442 0%, rgba(201,100,66,0.12) 50%, transparent 100%)' }} />

        {/* ── Period tabs ── */}
        <div className="flex items-center gap-1.5 mb-8 flex-wrap">
          {PRESET_PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{ background: period === p ? '#C96442' : 'transparent', color: period === p ? '#FFFFFF' : '#7C7369', border: `1px solid ${period === p ? '#C96442' : '#EDE9E4'}` }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <button onClick={() => setPeriod('custom')}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
            style={{ background: period === 'custom' ? '#C96442' : 'transparent', color: period === 'custom' ? '#FFFFFF' : '#7C7369', border: `1px solid ${period === 'custom' ? '#C96442' : '#EDE9E4'}` }}
          >
            {t.custom}
          </button>
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', color: '#1A1714', fontFamily: 'inherit' }} />
              <span className="text-xs" style={{ color: '#B0A9A1' }}>{t.dateArrow}</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', color: '#1A1714', fontFamily: 'inherit' }} />
            </div>
          )}
          <span className="ml-auto text-xs hidden sm:inline" style={{ color: '#B0A9A1' }}>
            {stats.meta.first_session} {t.dateArrow} {stats.meta.last_session} · {stats.meta.total_projects} {t.projects}
          </span>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title={t.totalCost} value={formatCost(data.cost)} subtitle={t.thisPeriod} delta={data.cost_delta} />
          <MetricCard title={t.activeHours} value={formatMinutes(data.hours.active_minutes)} subtitle={`${t.span} ${formatMinutes(data.hours.span_minutes)}`} />
          <MetricCard title={t.sessions} value={String(data.sessions)} subtitle={`${stats.meta.total_projects} ${t.projects}`} />
          <MetricCard title={t.totalTokens} value={formatTokens(data.tokens.total)} subtitle={`${Math.round((data.tokens.cache_read / (data.tokens.total || 1)) * 100)}% ${t.cacheRead}`} />
        </div>

        {/* ── Row 1: Cost + Tokens ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[
            { title: t.costOverTime, sub: t.usdPeriod, chart: <CostChart days={data.days} /> },
            { title: t.tokenBreakdown, sub: t.stacked, chart: <TokenChart days={data.days} /> },
          ].map(({ title, sub, chart }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{title}</h2>
                <span className="text-xs" style={{ color: '#B0A9A1' }}>{sub}</span>
              </div>
              {chart}
            </div>
          ))}
        </div>

        {/* ── Row 2: Active Hours + Sessions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[
            { title: t.activeHoursChart, sub: t.perDay, chart: <HoursChart days={data.days} /> },
            { title: t.sessionsChart, sub: t.perDay, chart: <SessionsChart days={data.days} /> },
          ].map(({ title, sub, chart }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{title}</h2>
                <span className="text-xs" style={{ color: '#B0A9A1' }}>{sub}</span>
              </div>
              {chart}
            </div>
          ))}
        </div>

        {/* ── Activity Heatmap ── */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{t.activity}</h2>
            <span className="text-xs" style={{ color: '#B0A9A1' }}>{t.weeksIntensity}</span>
          </div>
          <ActivityHeatmap days={stats.all_time.days} totalSessions={stats.all_time.sessions} totalDays={activeDaysAllTime} favoriteModel={favoriteModel} totalTokens={totalTokensAllTime} lang={lang} />
        </div>

        {/* ── Row 3: Working Hours + Projects ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{t.workingHours}</h2>
              <span className="text-xs" style={{ color: '#B0A9A1' }}>{t.activeSpanIdle}</span>
            </div>
            <HoursDisplay hours={data.hours} lang={lang} />
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
            <div className="px-5 py-4 flex items-baseline justify-between" style={{ borderBottom: '1px solid #EDE9E4' }}>
              <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{t.projectsSection}</h2>
              <span className="text-xs" style={{ color: '#B0A9A1' }}>{stats.projects.length} {t.total}</span>
            </div>
            <ProjectTable projects={stats.projects} lang={lang} />
          </div>
        </div>

        {/* ── Row 4: Models + Usage ── */}
        {stats.model_breakdown && stats.usage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{t.modelsSection}</h2>
                <span className="text-xs" style={{ color: '#B0A9A1' }}>{t.tokenDist}</span>
              </div>
              <ModelsBreakdown days={data.days} modelBreakdown={stats.model_breakdown} lang={lang} />
            </div>
            <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EDE9E4', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)' }}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>{t.usageSection}</h2>
                <span className="text-xs" style={{ color: '#B0A9A1' }}>{t.vsPeak}</span>
              </div>
              <UsageLimitsDisplay usage={stats.usage} lang={lang} />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid #EDE9E4' }}>
          <p className="text-xs italic" style={{ color: '#B0A9A1', fontFamily: 'var(--font-lora), Georgia, serif' }}>
            {t.footer}
          </p>
          <p className="text-xs hidden sm:block" style={{ color: '#C4B5A0' }}>
            {stats.meta.first_session} {t.dateArrow} {stats.meta.last_session}
          </p>
        </div>
      </div>
    </div>
  )
}
