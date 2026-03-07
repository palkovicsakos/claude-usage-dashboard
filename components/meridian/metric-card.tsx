'use client'

import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDelta } from '@/lib/utils-stats'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  delta?: number | null
  icon?: LucideIcon
}

export function MetricCard({ title, value, subtitle, delta, icon: Icon }: MetricCardProps) {
  const hasDelta = delta !== null && delta !== undefined
  const isPositive = hasDelta && delta! >= 0

  return (
    <Card className="bg-white border border-[#E2E8F0] shadow-none rounded-xl py-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-[#64748B] uppercase tracking-wide leading-none">
            {title}
          </span>
          {Icon && (
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#DBEAFE]">
              <Icon className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
          )}
        </div>

        <div className="flex items-end gap-2.5 flex-wrap">
          <span className="font-mono text-2xl font-semibold text-[#0F172A] leading-none tracking-tight">
            {value}
          </span>
          {hasDelta && (
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium font-mono leading-none mb-0.5',
                isPositive
                  ? 'bg-emerald-50 text-[#10B981]'
                  : 'bg-red-50 text-[#EF4444]'
              )}
            >
              {formatDelta(delta!)}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-xs text-[#64748B] leading-snug">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
