'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ProjectStats } from '@/lib/types'
import { formatCost } from '@/lib/utils-stats'

interface ProjectTableProps {
  projects: ProjectStats[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const maxPct = Math.max(...projects.map((p) => p.pct))

  return (
    <Table>
      <TableHeader>
        <TableRow
          style={{ borderBottom: '1px solid #EDE9E4' }}
          className="hover:bg-transparent"
        >
          <TableHead
            className="text-xs uppercase tracking-widest font-medium"
            style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.1em' }}
          >
            Project
          </TableHead>
          <TableHead
            className="text-right text-xs uppercase tracking-widest font-medium"
            style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.1em' }}
          >
            Cost
          </TableHead>
          <TableHead
            className="text-right text-xs uppercase tracking-widest font-medium hidden sm:table-cell"
            style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.1em' }}
          >
            Hours
          </TableHead>
          <TableHead
            className="text-right text-xs uppercase tracking-widest font-medium hidden md:table-cell"
            style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.1em' }}
          >
            Sessions
          </TableHead>
          <TableHead
            className="text-right text-xs uppercase tracking-widest font-medium"
            style={{ color: '#7C7369', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.1em' }}
          >
            Share
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project, i) => (
          <TableRow
            key={project.name}
            style={{
              background: i % 2 === 0 ? '#FFFFFF' : '#FAF9F6',
              borderBottom: '1px solid #EDE9E4',
              cursor: 'default',
            }}
            className="transition-colors duration-150"
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLTableRowElement).style.background = '#F5E8E1'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLTableRowElement).style.background =
                i % 2 === 0 ? '#FFFFFF' : '#FAF9F6'
            }}
          >
            {/* Project name */}
            <TableCell className="py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: i === 0 ? '#D97757' : i < 3 ? '#F5B896' : '#C4B5A0',
                  }}
                />
                <span
                  className="text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]"
                  style={{
                    color: '#1A1714',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif',
                  }}
                >
                  {project.name}
                </span>
              </div>
            </TableCell>

            {/* Cost */}
            <TableCell className="text-right py-2.5">
              <span
                className="text-sm font-semibold tabular-nums"
                style={{
                  color: '#D97757',
                  fontFamily: 'var(--font-berkeley-mono), JetBrains Mono, monospace',
                }}
              >
                {formatCost(project.cost)}
              </span>
            </TableCell>

            {/* Hours */}
            <TableCell className="text-right py-2.5 hidden sm:table-cell">
              <span
                className="text-sm tabular-nums"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-berkeley-mono), JetBrains Mono, monospace',
                }}
              >
                {project.active_hours}h
              </span>
            </TableCell>

            {/* Sessions */}
            <TableCell className="text-right py-2.5 hidden md:table-cell">
              <span
                className="text-sm tabular-nums"
                style={{
                  color: '#7C7369',
                  fontFamily: 'var(--font-berkeley-mono), JetBrains Mono, monospace',
                }}
              >
                {project.sessions}
              </span>
            </TableCell>

            {/* Share bar */}
            <TableCell className="text-right py-2.5">
              <div className="flex items-center gap-2 justify-end">
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: 52, height: 5, background: '#F5E8E1' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(project.pct / maxPct) * 100}%`,
                      background: 'linear-gradient(90deg, #F5B896, #D97757)',
                    }}
                  />
                </div>
                <span
                  className="text-xs w-8 text-right tabular-nums"
                  style={{
                    color: '#7C7369',
                    fontFamily: 'var(--font-berkeley-mono), JetBrains Mono, monospace',
                  }}
                >
                  {project.pct}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
