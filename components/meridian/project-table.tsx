'use client'

import { type ProjectStats } from '@/lib/types'
import { formatCost, formatMinutes } from '@/lib/utils-stats'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProjectTableProps {
  projects: ProjectStats[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const sorted = [...projects].sort((a, b) => b.cost - a.cost)

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[#E2E8F0] hover:bg-transparent">
          <TableHead className="text-xs text-[#64748B] font-medium uppercase tracking-wide h-8 px-3">
            Project
          </TableHead>
          <TableHead className="text-xs text-[#64748B] font-medium uppercase tracking-wide h-8 px-3 text-right">
            Cost
          </TableHead>
          <TableHead className="text-xs text-[#64748B] font-medium uppercase tracking-wide h-8 px-3 text-right hidden sm:table-cell">
            Active
          </TableHead>
          <TableHead className="text-xs text-[#64748B] font-medium uppercase tracking-wide h-8 px-3 text-right hidden sm:table-cell">
            Sessions
          </TableHead>
          <TableHead className="text-xs text-[#64748B] font-medium uppercase tracking-wide h-8 px-3">
            Share
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((project) => (
          <TableRow
            key={project.name}
            className="border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
          >
            <TableCell className="px-3 py-2.5 max-w-[140px]">
              <span
                className="font-mono text-xs text-[#0F172A] block truncate"
                title={project.name}
              >
                {project.name}
              </span>
            </TableCell>
            <TableCell className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-[#0F172A]">
              {formatCost(project.cost)}
            </TableCell>
            <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden sm:table-cell">
              {formatMinutes(project.active_hours * 60)}
            </TableCell>
            <TableCell className="px-3 py-2.5 text-right font-mono text-xs text-[#64748B] hidden sm:table-cell">
              {project.sessions}
            </TableCell>
            <TableCell className="px-3 py-2.5 min-w-[80px]">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2563EB]"
                    style={{ width: `${Math.min(project.pct, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-[#64748B] w-10 text-right shrink-0">
                  {project.pct.toFixed(1)}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
