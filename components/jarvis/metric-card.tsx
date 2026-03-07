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
      className="group relative rounded-sm p-5 transition-all duration-200"
      style={{
        background: '#0D0D14',
        border: '1px solid rgba(0, 212, 255, 0.13)',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.07)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.border = '1px solid rgba(0, 212, 255, 0.33)'
        el.style.boxShadow = '0 0 28px rgba(0, 212, 255, 0.14)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.border = '1px solid rgba(0, 212, 255, 0.13)'
        el.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.07)'
      }}
    >
      {/* corner accent */}
      <div
        className="absolute top-0 left-0 w-4 h-4"
        style={{
          borderTop: '1px solid rgba(0, 212, 255, 0.5)',
          borderLeft: '1px solid rgba(0, 212, 255, 0.5)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4"
        style={{
          borderBottom: '1px solid rgba(0, 212, 255, 0.5)',
          borderRight: '1px solid rgba(0, 212, 255, 0.5)',
        }}
      />

      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: '#4A5568', letterSpacing: '0.15em' }}
      >
        {title}
      </p>

      <p
        className="text-3xl font-mono font-bold leading-none mb-2"
        style={{ color: '#E8EDF5' }}
      >
        {value}
      </p>

      <div className="flex items-center gap-2 mt-2">
        {delta != null && (
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: delta >= 0 ? '#00D4FF' : '#FF3B5C' }}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs" style={{ color: '#4A5568' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
