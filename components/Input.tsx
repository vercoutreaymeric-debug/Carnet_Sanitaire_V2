interface InputProps {
  label: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  unit?: string
  required?: boolean
  placeholder?: string
  style?: React.CSSProperties
  min?: number
  max?: number
  step?: number
}

export default function Input({
  label, value, onChange, type = 'text', unit, required, placeholder, style: s, min, max, step,
}: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...s }}>
      <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            padding: unit ? '8px 40px 8px 12px' : '8px 12px',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: type === 'number' ? 'DM Mono, monospace' : 'DM Sans, sans-serif',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
        />
        {unit && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', fontSize: 12, pointerEvents: 'none',
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
