'use client'

import { useState } from 'react'
import type { ProjectStats } from '@/lib/types'
import { formatCost } from '@/lib/utils-stats'

const VISIBLE_COUNT = 10

interface ProjectTableProps {
  projects: ProjectStats[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? projects : projects.slice(0, VISIBLE_COUNT)
  const hasMore = projects.length > VISIBLE_COUNT
  const maxPct = Math.max(...projects.map((p) => p.pct))

  return (
    <div className="w-full">
      {/* Header */}
      <div
        className="grid text-xs uppercase tracking-widest pb-2 mb-1"
        style={{
          gridTemplateColumns: '1fr 90px 60px 50px 100px',
          color: '#4A5568',
          letterSpacing: '0.1em',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span>Project</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Hours</span>
        <span className="text-right">Sessions</span>
        <span className="text-right">Share</span>
      </div>

      {/* Rows */}
      {visible.map((project, i) => (
        <div
          key={project.name}
          className="grid items-center py-2 px-1 rounded-sm transition-colors duration-150 cursor-default"
          style={{
            gridTemplateColumns: '1fr 90px 60px 50px 100px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 212, 255, 0.04)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent'
          }}
        >
          {/* Name */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{
                background: i < 3 ? '#00D4FF' : i < 6 ? '#7928CA' : '#4A5568',
                boxShadow: i < 3 ? '0 0 6px rgba(0,212,255,0.6)' : 'none',
              }}
            />
            <span
              className="text-xs font-mono truncate"
              style={{ color: '#E8EDF5' }}
            >
              {project.name}
            </span>
          </div>

          {/* Cost */}
          <span
            className="text-xs font-mono text-right font-semibold"
            style={{ color: '#00D4FF' }}
          >
            {formatCost(project.cost)}
          </span>

          {/* Hours */}
          <span
            className="text-xs font-mono text-right"
            style={{ color: '#4A5568' }}
          >
            {project.active_hours}h
          </span>

          {/* Sessions */}
          <span
            className="text-xs font-mono text-right"
            style={{ color: '#4A5568' }}
          >
            {project.sessions}
          </span>

          {/* Share bar */}
          <div className="flex items-center gap-2 justify-end">
            <div
              className="rounded-full overflow-hidden"
              style={{ width: 52, height: 4, background: 'rgba(0,212,255,0.08)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(project.pct / maxPct) * 100}%`,
                  background: i < 3 ? '#00D4FF' : i < 6 ? '#7928CA' : '#4A5568',
                }}
              />
            </div>
            <span
              className="text-xs font-mono w-8 text-right"
              style={{ color: '#4A5568' }}
            >
              {project.pct}%
            </span>
          </div>
        </div>
      ))}
      {/* Show more / less toggle */}
      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-2 w-full py-2 text-xs font-mono tracking-widest transition-colors duration-150"
          style={{
            color: '#4A5568',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 2,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#00D4FF'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.2)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#4A5568'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          {showAll ? `▲ SHOW LESS` : `▼ SHOW ${projects.length - VISIBLE_COUNT} MORE`}
        </button>
      )}
    </div>
  )
}
