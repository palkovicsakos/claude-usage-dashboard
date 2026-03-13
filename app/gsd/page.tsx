'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Space_Mono, IBM_Plex_Sans } from 'next/font/google'
import Link from 'next/link'

const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono' })
const ibmPlex = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-ibm-plex' })

// ── Types ──────────────────────────────────────────────────────────────────

type GsdPhase = {
  name: string
  status: 'complete' | 'active' | 'pending'
  plans_complete: number
  plans_total: number
  completed_date: string | null
}

type GsdProject = {
  id: string
  name: string
  milestone: string
  phases_complete: number
  phases_total: number
  gsd_status: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED'
  current_phase: string | null
  phases: GsdPhase[]
}

type GsdData = {
  generated_at: string
  source_refreshed: string
  project_count: number
  projects: GsdProject[]
}

type Priority = 'High' | 'Medium' | 'Low' | 'N/A'
type Stage = 'Idea' | 'Planning' | 'In Progress' | 'Blocked' | 'In Review' | 'Complete'

type Annotation = {
  priority?: Priority
  stage?: Stage
  deadline?: string
  notes?: string
  onHold?: boolean
}

type Annotations = Record<string, Annotation>

// ── Constants ─────────────────────────────────────────────────────────────

const STAGES: Stage[] = ['Idea', 'Planning', 'In Progress', 'Blocked', 'In Review', 'Complete']
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low', 'N/A']
const STORAGE_KEY = 'gsd-annotations'
const REFRESH_INTERVAL = 60_000

const CARD_STYLE = { background: '#0D0D14', border: '1px solid rgba(0,212,255,0.10)', boxShadow: '0 0 20px rgba(0,212,255,0.04)' }
const MONO = 'var(--font-space-mono), monospace'

// ── Helpers ───────────────────────────────────────────────────────────────

function gsdStatusToStage(project: GsdProject): Stage {
  if (project.gsd_status === 'COMPLETE') return 'Complete'
  if (project.gsd_status === 'IN_PROGRESS') return 'In Progress'
  if (project.phases_total === 0) return 'Idea'
  return 'Planning'
}

function getPct(complete: number, total: number) {
  return total ? Math.round((complete / total) * 100) : 0
}

function getAnno<K extends keyof Annotation>(
  annotations: Annotations, id: string, key: K, fallback: Annotation[K]
): Annotation[K] {
  return annotations[id]?.[key] ?? fallback
}

function saveAnnotations(a: Annotations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)) } catch {}
}

function loadAnnotations(): Annotations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// ── Sub-components ────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, React.CSSProperties> = {
    High:   { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' },
    Medium: { background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)', color: '#FB923C' },
    Low:    { background: 'rgba(163,163,163,0.10)', border: '1px solid rgba(163,163,163,0.2)', color: '#9CA3AF' },
    'N/A':  { background: 'rgba(55,65,81,0.2)', border: '1px solid rgba(55,65,81,0.3)', color: '#4A5568' },
  }
  return (
    <span style={{ ...styles[priority], fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 2, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  )
}

function StatusDot({ stage }: { stage: Stage }) {
  const color = stage === 'Blocked' ? '#EF4444'
    : stage === 'Complete' ? '#10B981'
    : stage === 'In Progress' ? '#00D4FF'
    : stage === 'Idea' ? '#374151'
    : '#4A5568'
  const glow = (stage === 'Blocked' || stage === 'In Progress' || stage === 'Complete')
    ? `0 0 5px ${color}` : 'none'
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, boxShadow: glow, flexShrink: 0, marginTop: 3,
      animation: (stage === 'In Progress' || stage === 'Blocked') ? 'pulse 2s infinite' : 'none',
    }} />
  )
}

function ProgressBar({ pct, stage }: { pct: number; stage: Stage }) {
  const bg = stage === 'Complete' ? 'linear-gradient(90deg,#10B981,#34D399)'
    : stage === 'Blocked' ? 'linear-gradient(90deg,#991B1B,#EF4444)'
    : stage === 'In Progress' ? 'linear-gradient(90deg,#0891B2,#00D4FF)'
    : 'linear-gradient(90deg,#D97706,#F59E0B)'
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: bg, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────

function ProjectCard({
  project, annotations, selected, onSelect, onAnnotate, openNote, setOpenNote,
}: {
  project: GsdProject
  annotations: Annotations
  selected: boolean
  onSelect: () => void
  onAnnotate: (id: string, key: keyof Annotation, value: unknown) => void
  openNote: boolean
  setOpenNote: (v: boolean) => void
}) {
  const stage = getAnno(annotations, project.id, 'stage', gsdStatusToStage(project)) as Stage
  const priority = getAnno(annotations, project.id, 'priority', 'N/A') as Priority
  const deadline = getAnno(annotations, project.id, 'deadline', '') as string
  const notes = getAnno(annotations, project.id, 'notes', '') as string
  const onHold = getAnno(annotations, project.id, 'onHold', false) as boolean
  const pct = getPct(project.phases_complete, project.phases_total)
  const isBlocked = stage === 'Blocked'

  const cardBorder = selected
    ? '1px solid rgba(0,212,255,0.45)'
    : isBlocked ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)'
  const cardBg = selected
    ? 'rgba(0,212,255,0.04)'
    : isBlocked ? 'rgba(239,68,68,0.03)' : '#0D0D14'

  const noteRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (openNote && noteRef.current) noteRef.current.focus() }, [openNote])

  return (
    <div
      onClick={onSelect}
      style={{
        background: cardBg, border: cardBorder, borderRadius: 3,
        padding: 17, cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: selected ? '0 0 14px rgba(0,212,255,0.07)' : 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
        <span style={{
          fontFamily: MONO, fontSize: 17, fontWeight: 700, color: isBlocked ? '#EF4444' : selected ? '#00D4FF' : '#D1D5DB',
          lineHeight: 1.3,
        }}>
          {project.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: 2 }}>
          <StatusDot stage={stage} />
          <PriorityBadge priority={priority} />
          {isBlocked && (
            <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 6px', borderRadius: 2, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', letterSpacing: '0.08em' }}>
              BLOCKED
            </span>
          )}
          {onHold && !isBlocked && (
            <span style={{ fontFamily: MONO, fontSize: 12, padding: '2px 6px', borderRadius: 2, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#6B7280', letterSpacing: '0.08em' }}>
              ON HOLD
            </span>
          )}
        </div>
      </div>

      {/* Milestone */}
      <div style={{ fontSize: 16, color: '#4A5568', marginBottom: 8, lineHeight: 1.3, fontFamily: ibmPlex.style.fontFamily }}>
        {project.milestone}
      </div>

      {/* Progress */}
      <ProgressBar pct={pct} stage={stage} />

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MONO, fontSize: 14, color: '#4A5568' }}>
          {project.phases_complete}/{project.phases_total} phases
        </span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: deadline ? '#00D4FF' : '#2D3748', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ opacity: 0.7 }}>⏱</span>
          {deadline || '—'}
        </span>
      </div>

      {/* Quick note */}
      <div
        onClick={e => { e.stopPropagation(); setOpenNote(!openNote) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
          padding: '5px 9px', background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 2, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.25)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
      >
        <span style={{ fontSize: 16, color: '#4A5568' }}>✎</span>
        <span style={{ fontSize: 16, color: '#4A5568', fontFamily: ibmPlex.style.fontFamily, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {notes ? notes.substring(0, 40) + (notes.length > 40 ? '…' : '') : 'Add a note...'}
        </span>
      </div>

      {openNote && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 8 }}>
          <textarea
            ref={noteRef}
            defaultValue={notes}
            placeholder="Type a note... (Enter to save, Esc to close)"
            onChange={e => onAnnotate(project.id, 'notes', e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setOpenNote(false) }
              if (e.key === 'Escape') setOpenNote(false)
            }}
            style={{
              width: '100%', minHeight: 56, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(0,212,255,0.25)', borderRadius: 2, padding: '7px 9px',
              fontSize: 16, color: '#D1D5DB', fontFamily: ibmPlex.style.fontFamily,
              outline: 'none', resize: 'none',
            }}
          />
          <div style={{ fontFamily: MONO, fontSize: 13, color: '#374151', marginTop: 4 }}>
            ↵ save · esc close
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pipeline View ─────────────────────────────────────────────────────────

function PipelineView({
  projects, annotations, selected, onSelect, onAnnotate, openNotes, setOpenNote,
}: {
  projects: GsdProject[]
  annotations: Annotations
  selected: string | null
  onSelect: (id: string) => void
  onAnnotate: (id: string, key: keyof Annotation, value: unknown) => void
  openNotes: Record<string, boolean>
  setOpenNote: (id: string, v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, minHeight: 200 }}>
      {STAGES.map(stage => {
        const colProjects = projects.filter(p => {
          const s = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
          return s === stage
        })
        const isBlocked = stage === 'Blocked'
        return (
          <div key={stage} style={{ minWidth: 273, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Column header */}
            <div style={{
              fontFamily: MONO, fontSize: 14, letterSpacing: '0.15em', color: isBlocked ? '#EF4444' : '#4A5568',
              textTransform: 'uppercase', padding: '7px 10px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', borderBottom: `1px solid ${isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <span>{stage}</span>
              <span style={{
                background: isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                color: isBlocked ? '#EF4444' : '#4A5568',
                padding: '1px 7px', borderRadius: 8, fontSize: 14,
              }}>
                {colProjects.length}
              </span>
            </div>

            {colProjects.length === 0 ? (
              <div style={{ padding: '14px 10px', fontFamily: MONO, fontSize: 13, color: '#1F2937', textAlign: 'center', letterSpacing: '0.1em' }}>
                EMPTY
              </div>
            ) : colProjects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                annotations={annotations}
                selected={selected === p.id}
                onSelect={() => onSelect(p.id)}
                onAnnotate={onAnnotate}
                openNote={!!openNotes[p.id]}
                setOpenNote={v => setOpenNote(p.id, v)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────

function ListView({
  projects, annotations, selected, onSelect,
}: {
  projects: GsdProject[]
  annotations: Annotations
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, padding: '4px 12px', marginBottom: 3 }}>
        {[['Project', 2], ['Milestone', 3], ['Progress', 2], ['Stage', 1.5], ['Priority', 0.8]].map(([label, flex]) => (
          <span key={label as string} style={{ flex: flex as number, fontFamily: MONO, fontSize: 13, letterSpacing: '0.12em', color: '#2D3748', textTransform: 'uppercase' }}>
            {label}
          </span>
        ))}
      </div>

      {projects.map(p => {
        const stage = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
        const priority = getAnno(annotations, p.id, 'priority', 'N/A') as Priority
        const pct = getPct(p.phases_complete, p.phases_total)
        const isBlocked = stage === 'Blocked'
        const isSelected = selected === p.id

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '10px 12px', cursor: 'pointer', borderRadius: 2,
              background: isSelected ? 'rgba(0,212,255,0.04)' : '#0D0D14',
              border: isSelected ? '1px solid rgba(0,212,255,0.35)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.2)' }}
            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)' }}
          >
            <div style={{ flex: 2, fontFamily: MONO, fontSize: 16, fontWeight: 600, color: isSelected ? '#00D4FF' : isBlocked ? '#EF4444' : '#D1D5DB' }}>
              {p.name}
            </div>
            <div style={{ flex: 3, fontSize: 16, color: '#6B7280', fontFamily: ibmPlex.style.fontFamily }}>
              {p.milestone}
            </div>
            <div style={{ flex: 2 }}>
              <ProgressBar pct={pct} stage={stage} />
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#4A5568' }}>{p.phases_complete}/{p.phases_total}</span>
            </div>
            <div style={{ flex: 1.5, fontFamily: MONO, fontSize: 14, color: isBlocked ? '#EF4444' : '#4A5568' }}>
              {stage}
            </div>
            <div style={{ flex: 0.8, textAlign: 'right' }}>
              <PriorityBadge priority={priority} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Timeline View ─────────────────────────────────────────────────────────

function TimelineView({
  projects, annotations, selected, onSelect,
}: {
  projects: GsdProject[]
  annotations: Annotations
  selected: string | null
  onSelect: (id: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = projects.map(p => {
    const stage = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
    const priority = getAnno(annotations, p.id, 'priority', 'N/A') as Priority
    const deadline = getAnno(annotations, p.id, 'deadline', '') as string
    const pct = getPct(p.phases_complete, p.phases_total)
    const deadlineDate = deadline ? new Date(deadline + 'T00:00:00') : null
    const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000) : null
    const isOverdue = daysLeft !== null && daysLeft < 0
    const isBlocked = stage === 'Blocked'
    return { p, stage, priority, deadline, pct, daysLeft, isOverdue, isBlocked }
  }).sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(({ p, stage, priority, deadline, pct, daysLeft, isOverdue, isBlocked }) => {
        const isSelected = selected === p.id
        const barColor = isBlocked ? '#EF4444'
          : stage === 'Complete' ? '#10B981'
          : isOverdue ? '#EF4444'
          : stage === 'In Progress' ? '#00D4FF' : '#4A5568'

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              padding: '14px 16px', cursor: 'pointer', borderRadius: 3, transition: 'all 0.15s',
              background: isSelected ? 'rgba(0,212,255,0.04)' : '#0D0D14',
              border: isSelected ? '1px solid rgba(0,212,255,0.35)' : isBlocked ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,212,255,0.2)' }}
            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)' }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <StatusDot stage={stage} />
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: isSelected ? '#00D4FF' : isBlocked ? '#EF4444' : '#D1D5DB', flex: 1 }}>
                {p.name}
              </span>
              <PriorityBadge priority={priority} />
              <span style={{
                fontFamily: MONO, fontSize: 13,
                color: isOverdue ? '#EF4444' : daysLeft !== null && daysLeft <= 7 ? '#FB923C' : deadline ? '#6B7280' : '#2D3748',
                minWidth: 90, textAlign: 'right',
              }}>
                {daysLeft === null ? '—' : isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'due today' : `${daysLeft}d left`}
              </span>
            </div>

            {/* Progress bar with percentage label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 3, transition: 'width 0.3s',
                  background: isBlocked ? 'linear-gradient(90deg,#991B1B,#EF4444)'
                    : stage === 'Complete' ? 'linear-gradient(90deg,#10B981,#34D399)'
                    : `linear-gradient(90deg, ${barColor}80, ${barColor})`,
                }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#4A5568', minWidth: 44, textAlign: 'right' }}>
                {pct}%
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: '#2D3748', minWidth: 80, textAlign: 'right' }}>
                {p.phases_complete}/{p.phases_total} phases
              </span>
            </div>

            {/* Milestone + deadline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 14, color: '#374151', fontFamily: ibmPlex.style.fontFamily }}>
                {p.milestone}
              </span>
              {deadline && (
                <span style={{ fontFamily: MONO, fontSize: 13, color: isOverdue ? '#EF4444' : '#4A5568' }}>
                  ⏱ {deadline}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────

function DetailPanel({
  project, annotations, onAnnotate,
}: {
  project: GsdProject | null
  annotations: Annotations
  onAnnotate: (id: string, key: keyof Annotation, value: unknown) => void
}) {
  const sectionTitle = (label: string) => (
    <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.15em', color: '#4A5568', textTransform: 'uppercase', marginBottom: 10 }}>
      {label}
    </div>
  )

  if (!project) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#1F2937', fontFamily: MONO, fontSize: 16, letterSpacing: '0.1em', textAlign: 'center', lineHeight: 2.2 }}>
        ← SELECT A PROJECT<br />TO VIEW DETAILS
      </div>
    )
  }

  const stage = getAnno(annotations, project.id, 'stage', gsdStatusToStage(project)) as Stage
  const priority = getAnno(annotations, project.id, 'priority', 'N/A') as Priority
  const deadline = getAnno(annotations, project.id, 'deadline', '') as string
  const notes = getAnno(annotations, project.id, 'notes', '') as string
  const onHold = getAnno(annotations, project.id, 'onHold', false) as boolean
  const pct = getPct(project.phases_complete, project.phases_total)
  const isBlocked = stage === 'Blocked'

  const stageBg = isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.08)'
  const stageBorder = isBlocked ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,255,0.25)'
  const stageColor = isBlocked ? '#EF4444' : '#00D4FF'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 21, fontWeight: 700, color: isBlocked ? '#EF4444' : '#E8EDF5', marginBottom: 4 }}>
          {project.name}
        </div>
        <div style={{ fontSize: 17, color: '#6B7280', fontFamily: ibmPlex.style.fontFamily, marginBottom: 10 }}>
          {project.milestone}
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 13, padding: '3px 9px', borderRadius: 2, background: stageBg, border: `1px solid ${stageBorder}`, color: stageColor, letterSpacing: '0.08em' }}>
            {stage}
          </span>
          <PriorityBadge priority={priority} />
          {onHold && <span style={{ fontFamily: MONO, fontSize: 13, padding: '3px 9px', borderRadius: 2, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#6B7280' }}>ON HOLD</span>}
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <ProgressBar pct={pct} stage={stage} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 14, color: '#4A5568' }}>
          <span>{project.phases_complete} of {project.phases_total} phases</span>
          <span>{pct}%</span>
        </div>
      </div>

      {/* Stage selector */}
      <div>
        {sectionTitle('Stage')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {STAGES.map(s => {
            const isSel = stage === s
            const isBlockedBtn = s === 'Blocked'
            return (
              <button
                key={s}
                onClick={() => onAnnotate(project.id, 'stage', s)}
                style={{
                  padding: '5px 10px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em',
                  borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                  background: isSel ? (isBlockedBtn ? 'rgba(239,68,68,0.12)' : 'rgba(0,212,255,0.08)') : 'transparent',
                  border: isSel ? `1px solid ${isBlockedBtn ? 'rgba(239,68,68,0.35)' : 'rgba(0,212,255,0.3)'}` : '1px solid rgba(255,255,255,0.07)',
                  color: isSel ? (isBlockedBtn ? '#EF4444' : '#00D4FF') : '#4A5568',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Phase timeline */}
      {project.phases.length > 0 && (
        <div>
          {sectionTitle('Phase Timeline')}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {project.phases.map((phase, i) => {
              const isDone = phase.status === 'complete'
              const isActive = phase.status === 'active'
              const dotColor = isDone ? '#10B981' : isActive ? '#00D4FF' : 'rgba(255,255,255,0.08)'
              const dotBorder = isDone || isActive ? 'none' : '1px solid rgba(255,255,255,0.1)'
              const dotGlow = isActive ? '0 0 6px #00D4FF' : 'none'
              const lineColor = isDone ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)'
              const labelColor = isDone ? '#374151' : isActive ? '#00D4FF' : '#2D3748'
              const isLast = i === project.phases.length - 1

              return (
                <div key={i} style={{ display: 'flex', gap: 10, paddingTop: 6, paddingBottom: isLast ? 6 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: dotColor,
                      border: dotBorder, boxShadow: dotGlow, flexShrink: 0, marginTop: 2,
                      animation: isActive ? 'pulse 2s infinite' : 'none',
                    }} />
                    {!isLast && <div style={{ width: 1, flex: 1, minHeight: 10, background: lineColor }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 6 }}>
                    <div style={{
                      fontFamily: MONO, fontSize: 14, color: labelColor, lineHeight: 1.4,
                      textDecoration: isDone ? 'line-through' : 'none',
                      fontWeight: isActive ? 700 : 400,
                    }}>
                      {phase.name}
                    </div>
                    {(isActive || isDone) && (
                      <div style={{ fontSize: 14, color: '#4A5568', marginTop: 2, fontFamily: ibmPlex.style.fontFamily }}>
                        {isActive ? 'CURRENT' : phase.completed_date || 'Done'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Priority */}
      <div>
        {sectionTitle('Priority')}
        <div style={{ display: 'flex', gap: 5 }}>
          {PRIORITIES.map(p => {
            const isSel = priority === p
            const colors: Record<Priority, { bg: string; border: string; color: string }> = {
              High:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: '#EF4444' },
              Medium: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', color: '#FB923C' },
              Low:    { bg: 'rgba(163,163,163,0.1)', border: 'rgba(163,163,163,0.3)', color: '#9CA3AF' },
              'N/A':  { bg: 'rgba(55,65,81,0.2)', border: 'rgba(55,65,81,0.4)', color: '#6B7280' },
            }
            return (
              <button
                key={p}
                onClick={() => onAnnotate(project.id, 'priority', p)}
                style={{
                  flex: 1, padding: '7px 4px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em',
                  textAlign: 'center', cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
                  background: isSel ? colors[p].bg : 'transparent',
                  border: `1px solid ${isSel ? colors[p].border : 'rgba(255,255,255,0.07)'}`,
                  color: isSel ? colors[p].color : '#4A5568',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* On Hold toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: MONO, fontSize: 14, color: '#4A5568', letterSpacing: '0.1em' }}>ON HOLD</span>
        <div
          onClick={() => onAnnotate(project.id, 'onHold', !onHold)}
          style={{
            width: 32, height: 16, borderRadius: 8, cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
            background: onHold ? 'rgba(107,114,128,0.3)' : 'rgba(255,255,255,0.08)',
            border: onHold ? '1px solid rgba(107,114,128,0.5)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: onHold ? 18 : 3, width: 8, height: 8,
            background: onHold ? '#9CA3AF' : '#4A5568', borderRadius: '50%', transition: 'all 0.2s',
          }} />
        </div>
      </div>

      {/* Deadline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', color: '#4A5568', textTransform: 'uppercase' }}>Deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={e => onAnnotate(project.id, 'deadline', e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 2,
            padding: '8px 10px', fontSize: 17, color: '#D1D5DB', fontFamily: ibmPlex.style.fontFamily,
            outline: 'none', width: '100%', colorScheme: 'dark',
          }}
        />
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', color: '#4A5568', textTransform: 'uppercase' }}>Notes</label>
        <textarea
          value={notes}
          onChange={e => onAnnotate(project.id, 'notes', e.target.value)}
          placeholder="Add notes, blockers, or context..."
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 2,
            padding: '8px 10px', fontSize: 17, color: '#D1D5DB', fontFamily: ibmPlex.style.fontFamily,
            outline: 'none', width: '100%', minHeight: 90, resize: 'vertical',
          }}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function GsdPage() {
  const [data, setData] = useState<GsdData | null>(null)
  const [annotations, setAnnotations] = useState<Annotations>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'pipeline' | 'list' | 'timeline'>('pipeline')
  const [tab, setTab] = useState<'all' | 'in-progress' | 'blocked' | 'complete'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})

  // Load annotations from localStorage
  useEffect(() => { setAnnotations(loadAnnotations()) }, [])

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/gsd', { cache: 'no-store' })
    if (res.ok) setData(await res.json())
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true); setRefreshMsg(null)
    try {
      const res = await fetch('/api/gsd/refresh', { method: 'POST' })
      const json = await res.json()
      if (json.ok) { await fetchData(); setRefreshMsg('OK') } else setRefreshMsg('ERR')
    } catch { setRefreshMsg('ERR') }
    finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 3000)
    }
  }

  const onAnnotate = useCallback((id: string, key: keyof Annotation, value: unknown) => {
    setAnnotations(prev => {
      const next = { ...prev, [id]: { ...prev[id], [key]: value } }
      saveAnnotations(next)
      return next
    })
  }, [])

  const setOpenNote = useCallback((id: string, v: boolean) => {
    setOpenNotes(prev => ({ ...prev, [id]: v }))
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id)
  }, [])

  const navLinkStyle: React.CSSProperties = {
    padding: '5px 12px', fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#4A5568', borderRadius: 2, textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
  }

  const filteredProjects = data?.projects.filter(p => {
    if (tab === 'all') return true
    const stage = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
    if (tab === 'in-progress') return stage === 'In Progress' || stage === 'Planning'
    if (tab === 'blocked') return stage === 'Blocked'
    if (tab === 'complete') return stage === 'Complete'
    return true
  }) ?? []

  const selectedProject = selected ? (data?.projects.find(p => p.id === selected) ?? null) : null

  const inProgressCount = data?.projects.filter(p => {
    const s = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
    return s === 'In Progress' || s === 'Planning'
  }).length ?? 0
  const blockedCount = data?.projects.filter(p => {
    const s = getAnno(annotations, p.id, 'stage', gsdStatusToStage(p)) as Stage
    return s === 'Blocked'
  }).length ?? 0

  if (!data) {
    return (
      <div className={`${spaceMono.variable} ${ibmPlex.variable}`} style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5568', fontFamily: MONO, fontSize: 16 }}>
        LOADING GSD STATE...
      </div>
    )
  }

  return (
    <div
      className={`${spaceMono.variable} ${ibmPlex.variable}`}
      style={{
        minHeight: '100vh', background: '#060608',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '40px 40px', fontFamily: ibmPlex.style.fontFamily, color: '#E8EDF5',
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 1800, margin: '0 auto', padding: '22px 36px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
          <h1 style={{ fontFamily: MONO, fontSize: 21, fontWeight: 700, letterSpacing: '0.2em', color: '#E8EDF5' }}>
            JARVIS
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Refresh */}
            <button
              onClick={handleRefresh} disabled={refreshing}
              style={{
                ...navLinkStyle, cursor: refreshing ? 'not-allowed' : 'pointer',
                color: refreshMsg === 'OK' ? '#10B981' : refreshMsg === 'ERR' ? '#EF4444' : refreshing ? '#00D4FF' : '#4A5568',
                borderColor: refreshing ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {refreshing ? '⟳ …' : refreshMsg ? `✓ ${refreshMsg}` : '⟳ REFRESH'}
            </button>

            {/* SYS badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF', fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', borderRadius: 2 }}>
              <span style={{ width: 7, height: 7, background: '#00D4FF', borderRadius: '50%', boxShadow: '0 0 6px #00D4FF', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              SYS ONLINE
            </div>

            <Link href="/claude" style={navLinkStyle}>CLAUDE</Link>
            <span style={{ ...navLinkStyle, background: 'rgba(0,212,255,0.08)', borderColor: 'rgba(0,212,255,0.3)', color: '#00D4FF' }}>GSD</span>
            <Link href="/jarvis" style={navLinkStyle}>JARVIS STATS</Link>
          </div>
        </div>

        {/* ── Cyan divider ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,#00D4FF 0%,rgba(0,212,255,0.15) 60%,transparent 100%)', margin: '14px 0' }} />

        {/* ── View toggle + Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              ['all', 'ALL', data.project_count],
              ['in-progress', 'IN PROGRESS', inProgressCount],
              ['blocked', 'BLOCKED', blockedCount],
              ['complete', 'COMPLETE', null],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '6px 16px', fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em',
                  background: tab === key ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: tab === key ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                  color: tab === key ? '#00D4FF' : '#4A5568',
                  borderRadius: 2, cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                }}
              >
                {label}{count != null ? ` (${count})` : ''}
                {tab === key && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 18, height: 2, background: '#00D4FF', boxShadow: '0 0 6px #00D4FF', borderRadius: 1 }} />}
              </button>
            ))}
          </div>

          {/* View toggle + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 14, color: '#2D3748' }}>
              {new Date(data.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['pipeline', 'list', 'timeline'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '4px 10px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.1em',
                    background: view === v ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: view === v ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.05)',
                    color: view === v ? '#D1D5DB' : '#4A5568', borderRadius: 2, cursor: 'pointer',
                  }}
                >
                  {v === 'pipeline' ? '⬛ PIPELINE' : v === 'list' ? '≡ LIST' : '▶ TIMELINE'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            {view === 'pipeline' ? (
              <PipelineView
                projects={filteredProjects}
                annotations={annotations}
                selected={selected}
                onSelect={handleSelect}
                onAnnotate={onAnnotate}
                openNotes={openNotes}
                setOpenNote={setOpenNote}
              />
            ) : view === 'list' ? (
              <ListView
                projects={filteredProjects}
                annotations={annotations}
                selected={selected}
                onSelect={handleSelect}
              />
            ) : (
              <TimelineView
                projects={filteredProjects}
                annotations={annotations}
                selected={selected}
                onSelect={handleSelect}
              />
            )}
          </div>

          {/* Detail panel */}
          <div style={{
            width: 468, minWidth: 468, ...CARD_STYLE,
            borderRadius: 3, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 160px)',
          }}>
            <DetailPanel
              project={selectedProject}
              annotations={annotations}
              onAnnotate={onAnnotate}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#4A5568' }}>CLAUDE CODE // SWEY INNOVATIONS // GSD PIPELINE</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#4A5568' }}>
            {data.project_count} projects · refreshed {data.source_refreshed}
          </span>
        </div>
      </div>
    </div>
  )
}
