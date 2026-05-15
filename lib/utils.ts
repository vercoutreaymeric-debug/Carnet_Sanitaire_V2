export function computeStatus(
  ph: number,
  chloreLibre: number,
  chloreCombine: number
): 'conforme' | 'attention' | 'nonconforme' {
  if ((ph < 7.1 || ph > 7.8) || chloreLibre < 0.4 || chloreCombine > 0.8) return 'nonconforme'
  if (ph > 7.6 || chloreLibre < 0.6 || chloreCombine > 0.6) return 'attention'
  return 'conforme'
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDateFR(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function currentMonthISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
