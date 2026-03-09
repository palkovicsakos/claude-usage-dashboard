'use client'

import { useMemo } from 'react'
import type { DayStats } from '@/lib/types'
import { T, type Lang } from '@/lib/i18n'

interface ActivityHeatmapProps {
  days: DayStats[]
  totalSessions: number
  totalDays: number
  favoriteModel?: string
  totalTokens: number
  longestStreak: number
  currentStreak: number
  lang?: Lang
}

function getMonthLabel(dateStr: string, lang: Lang): string {
  const locale = lang === 'hu' ? 'hu-HU' : 'en-US'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, { month: 'short' })
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

export function ActivityHeatmap({ days, totalSessions, totalDays, favoriteModel, totalTokens, longestStreak, currentStreak, lang = 'en' }: ActivityHeatmapProps) {
  const t = T[lang]

  const { cells, weeks, maxCost, monthLabels, activeDays } = useMemo(() => {
    const dateMap: Record<string, number> = {}
    for (const d of days) dateMap[d.date] = (dateMap[d.date] || 0) + d.cost

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDow = (today.getDay() + 6) % 7
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 52 * 7 - todayDow)

    const cells: { date: string; cost: number; dow: number; week: number }[] = []
    let week = 0
    const cur = new Date(startDate)

    while (cur <= today) {
      const dateStr = cur.toISOString().split('T')[0]
      const dow = (cur.getDay() + 6) % 7
      if (dow === 0 && cells.length > 0) week++
      cells.push({ date: dateStr, cost: dateMap[dateStr] || 0, dow, week })
      cur.setDate(cur.getDate() + 1)
    }

    const maxCost = Math.max(...cells.map(c => c.cost), 0.01)
    const totalWeeks = week + 1

    const seen = new Set<string>()
    const monthLabels: { week: number; label: string }[] = []
    for (const cell of cells) {
      const month = cell.date.substring(0, 7)
      if (!seen.has(month)) {
        seen.add(month)
        monthLabels.push({ week: cell.week, label: getMonthLabel(cell.date, lang) })
      }
    }

    const activeDays = cells.filter(c => c.cost > 0).length
    return { cells, weeks: totalWeeks, maxCost, monthLabels, activeDays }
  }, [days, lang])

  function getCellColor(cost: number): string {
    if (cost === 0) return 'rgba(0,212,255,0.04)'
    const intensity = cost / maxCost
    if (intensity < 0.2) return 'rgba(0,212,255,0.15)'
    if (intensity < 0.4) return 'rgba(0,212,255,0.3)'
    if (intensity < 0.6) return 'rgba(0,212,255,0.5)'
    if (intensity < 0.8) return 'rgba(0,212,255,0.7)'
    return '#00D4FF'
  }

  const CELL = 12
  const GAP = 2
  const DOW_LABELS = t.dowLabels

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-px mb-1 ml-8" style={{ gap: GAP }}>
        {Array.from({ length: weeks }, (_, w) => {
          const label = monthLabels.find(m => m.week === w)
          return (
            <div key={w} style={{ width: CELL, fontSize: 9, color: '#4A5568', fontFamily: 'monospace', flexShrink: 0 }}>
              {label ? label.label : ''}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-px" style={{ gap: GAP }}>
        <div className="flex flex-col mr-1" style={{ gap: GAP }}>
          {DOW_LABELS.map((label, i) => (
            <div key={i} style={{ width: 24, height: CELL, fontSize: 9, color: '#4A5568', fontFamily: 'monospace', lineHeight: `${CELL}px` }}>
              {label}
            </div>
          ))}
        </div>

        {Array.from({ length: weeks }, (_, w) => {
          const weekCells = cells.filter(c => c.week === w)
          return (
            <div key={w} className="flex flex-col" style={{ gap: GAP }}>
              {Array.from({ length: 7 }, (_, dow) => {
                const cell = weekCells.find(c => c.dow === dow)
                if (!cell) return <div key={dow} style={{ width: CELL, height: CELL }} />
                return (
                  <div
                    key={dow}
                    title={cell.cost > 0 ? `${cell.date}: $${cell.cost.toFixed(2)}` : cell.date}
                    style={{ width: CELL, height: CELL, borderRadius: 2, background: getCellColor(cell.cost), cursor: cell.cost > 0 ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 ml-8">
        <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace' }}>{t.less}</span>
        {[0, 0.2, 0.45, 0.7, 1].map((v, i) => (
          <div key={i} style={{ width: CELL, height: CELL, borderRadius: 2, background: getCellColor(v * maxCost * 0.99 + 0.01) }} />
        ))}
        <span style={{ fontSize: 9, color: '#4A5568', fontFamily: 'monospace' }}>{t.more}</span>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 grid grid-cols-2 gap-x-8 gap-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.favoriteModel}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{favoriteModel ? favoriteModel.replace('claude-', '') : '—'}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.totalTokensStat}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{formatTokensShort(totalTokens)}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.sessionsLabel}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>{totalSessions}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.longestStreak}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{longestStreak} {t.days}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.activeDays}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#E8EDF5' }}>{activeDays}/{totalDays}</span>
        </div>
        <div>
          <span className="text-xs font-mono" style={{ color: '#4A5568' }}>{t.currentStreak}: </span>
          <span className="text-xs font-mono font-semibold" style={{ color: '#00D4FF' }}>{currentStreak} {t.days}</span>
        </div>
      </div>
    </div>
  )
}
