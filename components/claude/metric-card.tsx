'use client'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  delta?: number | null
}

export function MetricCard({ title, value, subtitle, delta }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Label — small caps warm gray */}
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{
          color: '#7C7369',
          letterSpacing: '0.12em',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
        }}
      >
        {title}
      </p>

      {/* Value — Lora serif, large */}
      <p
        className="text-3xl font-bold leading-none mb-2"
        style={{
          color: '#1A1714',
          fontFamily: 'var(--font-lora), Georgia, serif',
        }}
      >
        {value}
      </p>

      {/* Subtitle + delta */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {delta != null && (
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: delta >= 0 ? '#2D8A55' : '#C13B3B',
              background: delta >= 0 ? 'rgba(45,138,85,0.08)' : 'rgba(193,59,59,0.08)',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span
            className="text-xs"
            style={{
              color: '#7C7369',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
