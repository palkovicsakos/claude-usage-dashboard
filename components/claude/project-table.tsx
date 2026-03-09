'use client'

import { useState } from 'react'
import type { ProjectStats } from '@/lib/types'
import { formatCost } from '@/lib/utils-stats'
import { T, type Lang } from '@/lib/i18n'

const VISIBLE_COUNT = 10

interface ProjectTableProps {
  projects: ProjectStats[]
  lang?: Lang
}

export function ProjectTable({ projects, lang = 'en' }: ProjectTableProps) {
  const t = T[lang]
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? projects : projects.slice(0, VISIBLE_COUNT)
  const hasMore = projects.length > VISIBLE_COUNT
  const maxPct = Math.max(...projects.map((p) => p.pct))

  return (
    <div className="w-full">
      <div className="grid text-xs uppercase tracking-widest px-5 py-3" style={{ gridTemplateColumns: '1fr 80px 55px 55px 90px', color: '#B0A9A1', letterSpacing: '0.08em', borderBottom: '1px solid #EDE9E4' }}>
        <span>{t.colProject}</span>
        <span className="text-right">{t.colCost}</span>
        <span className="text-right">{t.colHours}</span>
        <span className="text-right">{t.colSessions}</span>
        <span className="text-right">{t.colShare}</span>
      </div>

      {visible.map((project, i) => (
        <div
          key={project.name}
          className="grid items-center px-5 py-2.5 transition-colors duration-100 cursor-default"
          style={{ gridTemplateColumns: '1fr 80px 55px 55px 90px', borderBottom: '1px solid #F5F0EB' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,100,66,0.03)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i < 3 ? '#C96442' : i < 6 ? '#E8917A' : '#C4B5A0' }} />
            <span className="text-xs truncate" style={{ color: '#1A1714', fontFamily: 'inherit' }}>{project.name}</span>
          </div>
          <span className="text-xs text-right font-semibold" style={{ color: '#C96442' }}>{formatCost(project.cost)}</span>
          <span className="text-xs text-right" style={{ color: '#7C7369' }}>{project.active_hours}h</span>
          <span className="text-xs text-right" style={{ color: '#7C7369' }}>{project.sessions}</span>
          <div className="flex items-center gap-2 justify-end">
            <div className="rounded-full overflow-hidden" style={{ width: 44, height: 4, background: '#F5E8E1' }}>
              <div className="h-full rounded-full" style={{ width: `${(project.pct / maxPct) * 100}%`, background: i < 3 ? '#C96442' : i < 6 ? '#E8917A' : '#C4B5A0' }} />
            </div>
            <span className="text-xs w-8 text-right" style={{ color: '#B0A9A1' }}>{project.pct}%</span>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-3 text-xs transition-colors duration-150"
          style={{ color: '#B0A9A1', background: '#FAF9F6', border: 'none', cursor: 'pointer', borderTop: '1px solid #EDE9E4', fontFamily: 'inherit' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#C96442' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#B0A9A1' }}
        >
          {showAll ? t.showLess : t.showMore(projects.length - VISIBLE_COUNT)}
        </button>
      )}
    </div>
  )
}
