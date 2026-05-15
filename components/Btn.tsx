import Icon from './Icon'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface BtnProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: Variant
  icon?: Parameters<typeof Icon>[0]['name']
  small?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--accent)',    color: '#fff',           border: 'none' },
  secondary: { background: 'var(--surface2)',  color: 'var(--text)',    border: '1px solid var(--border2)' },
  danger:    { background: 'var(--red)',        color: '#fff',           border: 'none' },
  ghost:     { background: 'transparent',      color: 'var(--text2)',   border: '1px solid var(--border2)' },
}

export default function Btn({
  children, onClick, variant = 'primary', icon, small, disabled, type = 'button', style: extraStyle,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 8,
        fontFamily: 'DM Sans', fontWeight: 600,
        fontSize: small ? 12 : 14,
        padding: small ? '6px 12px' : '9px 18px',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        ...variantStyles[variant],
        ...extraStyle,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.6' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} />}
      {children}
    </button>
  )
}
