'use client'

import { useState } from 'react'
import { Lora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import statsData from '@/data/stats.json'
import type { StatsData, PeriodStats } from '@/lib/types'
import { formatCost, formatTokens, formatMinutes } from '@/lib/utils-stats'
import { MetricCard } from '@/components/claude/metric-card'
import { CostChart } from '@/components/claude/cost-chart'
import { TokenChart } from '@/components/claude/token-chart'
import { HoursDisplay } from '@/components/claude/hours-display'
import { ProjectTable } from '@/components/claude/project-table'

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-lora',
})

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-berkeley-mono',
})

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all_time', label: 'All Time' },
]

const stats = statsData as StatsData

export default function ClaudePage() {
  const [period, setPeriod] = useState<Period>('daily')
  const data: PeriodStats = stats[period]

  const lastUpdated = new Date(stats.generated_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`${lora.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} min-h-screen`}
      style={{
        background: '#FAF9F6',
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
        color: '#1A1714',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1
              className="text-2xl font-bold leading-tight tracking-tight"
              style={{
                fontFamily: 'var(--font-lora), Georgia, serif',
                color: '#1A1714',
              }}
            >
              ⬡ claude stats
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{
                color: '#7C7369',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
              }}
            >
              Usage Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Last updated */}
            <span
              className="hidden sm:inline-block text-xs mr-2"
              style={{
                color: '#7C7369',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
              }}
            >
              Updated {lastUpdated}
            </span>

            {/* Theme pills */}
            <Link
              href="/jarvis"
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(0,0,0,0.04)',
                color: '#7C7369',
                border: '1px solid rgba(0,0,0,0.07)',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = '#1A1714'
                el.style.color = '#FAF9F6'
                el.style.borderColor = '#1A1714'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(0,0,0,0.04)'
                el.style.color = '#7C7369'
                el.style.borderColor = 'rgba(0,0,0,0.07)'
              }}
            >
              JARVIS
            </Link>
            <Link
              href="/meridian"
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(0,0,0,0.04)',
                color: '#7C7369',
                border: '1px solid rgba(0,0,0,0.07)',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = '#1A1714'
                el.style.color = '#FAF9F6'
                el.style.borderColor = '#1A1714'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(0,0,0,0.04)'
                el.style.color = '#7C7369'
                el.style.borderColor = 'rgba(0,0,0,0.07)'
              }}
            >
              MERIDIAN
            </Link>
          </div>
        </div>

        {/* ── Warm separator ── */}
        <div
          className="w-full mb-6"
          style={{ height: 1, background: '#EDE9E4' }}
        />

        {/* ── Period tabs (pill style) ── */}
        <div className="flex items-center gap-1.5 mb-8 flex-wrap">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: period === key ? '#D97757' : 'transparent',
                color: period === key ? '#FFFFFF' : '#7C7369',
                border: period === key ? '1px solid #D97757' : '1px solid rgba(0,0,0,0.07)',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
              }}
            >
              {label}
            </button>
          ))}

          <span
            className="ml-auto text-xs hidden sm:inline"
            style={{
              color: '#7C7369',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            {stats.meta.first_session} &rarr; {stats.meta.last_session} &middot; {stats.meta.total_projects} projects
          </span>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Cost"
            value={formatCost(data.cost)}
            subtitle="this period"
            delta={data.cost_delta}
          />
          <MetricCard
            title="Active Hours"
            value={formatMinutes(data.hours.active_minutes)}
            subtitle={`span ${formatMinutes(data.hours.span_minutes)}`}
          />
          <MetricCard
            title="Sessions"
            value={String(data.sessions)}
            subtitle={`across ${stats.meta.total_projects} projects`}
          />
          <MetricCard
            title="Total Tokens"
            value={formatTokens(data.tokens.total)}
            subtitle={`${Math.round((data.tokens.cache_read / (data.tokens.total || 1)) * 100)}% cache read`}
          />
        </div>

        {/* ── Charts row 1: Cost + Token ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Cost over time */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-lora), Georgia, serif',
                  color: '#1A1714',
                }}
              >
                Cost over time
              </h2>
              <span
                className="text-xs"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                USD / period
              </span>
            </div>
            <CostChart days={data.days} />
          </div>

          {/* Token breakdown */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-lora), Georgia, serif',
                  color: '#1A1714',
                }}
              >
                Token breakdown
              </h2>
              <span
                className="text-xs"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                stacked
              </span>
            </div>
            <TokenChart days={data.days} />
          </div>
        </div>

        {/* ── Charts row 2: Hours + Projects ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Working hours */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-baseline justify-between mb-5">
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-lora), Georgia, serif',
                  color: '#1A1714',
                }}
              >
                Working hours
              </h2>
              <span
                className="text-xs"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                active vs span vs idle
              </span>
            </div>
            <HoursDisplay hours={data.hours} />
          </div>

          {/* Project breakdown */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="px-5 py-4 flex items-baseline justify-between"
              style={{ borderBottom: '1px solid #EDE9E4' }}
            >
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-lora), Georgia, serif',
                  color: '#1A1714',
                }}
              >
                Project breakdown
              </h2>
              <span
                className="text-xs"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                {stats.projects.length} projects
              </span>
            </div>
            <ProjectTable projects={stats.projects} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between pt-5"
          style={{ borderTop: '1px solid #EDE9E4' }}
        >
          <p
            className="text-xs italic"
            style={{
              color: '#7C7369',
              fontFamily: 'var(--font-lora), Georgia, serif',
            }}
          >
            Generated by claude-stats &middot; Updated daily at 06:00
          </p>
          <p
            className="text-xs hidden sm:block"
            style={{
              color: '#C4B5A0',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            {stats.meta.first_session} &rarr; {stats.meta.last_session}
          </p>
        </div>
      </div>
    </div>
  )
}
