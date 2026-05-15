type Status = 'conforme' | 'attention' | 'nonconforme' | 'info' | string

const statusMap: Record<string, { label: string; color: string }> = {
  conforme:     { label: 'Conforme',     color: 'var(--green)' },
  attention:    { label: 'Attention',    color: 'var(--orange)' },
  nonconforme:  { label: 'Non conforme', color: 'var(--red)' },
  info:         { label: 'En cours',     color: 'var(--accent)' },
  'en cours':   { label: 'En cours',     color: 'var(--orange)' },
  'résolu':     { label: 'Résolu',       color: 'var(--green)' },
  'clôturé':    { label: 'Clôturé',      color: 'var(--green)' },
}

interface BadgeProps {
  status: Status
  small?: boolean
}

export default function Badge({ status, small }: BadgeProps) {
  const s = statusMap[status] ?? { label: status, color: 'var(--accent)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.color + '22', color: s.color,
      border: `1px solid ${s.color}44`,
      borderRadius: 20, padding: small ? '2px 8px' : '4px 10px',
      fontSize: small ? 11 : 12, fontWeight: 600, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}
