type MetricStatus = 'ok' | 'warn' | 'bad' | null

interface MetricProps {
  label: string
  value: string | number | null
  unit?: string
  status?: MetricStatus
  sublabel?: string
}

const statusColor: Record<string, string> = {
  ok:   'var(--green)',
  warn: 'var(--orange)',
  bad:  'var(--red)',
}

export default function Metric({ label, value, unit, status, sublabel }: MetricProps) {
  const color = status ? statusColor[status] : 'var(--text)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 500, color }}>
          {value ?? '—'}
        </span>
        {unit && value !== null && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{unit}</span>
        )}
      </div>
      {sublabel && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{sublabel}</span>}
    </div>
  )
}
