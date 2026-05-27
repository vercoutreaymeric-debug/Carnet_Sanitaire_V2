/**
 * Calcule le statut de conformité d'un relevé selon l'Arrêté du 7 avril 1981 modifié.
 * - chloreCombine : null si non renseigné (non pris en compte)
 *
 * Seuils réglementaires (piscines publiques, France) :
 *   pH         : 7.0 – 7.8   (optimal 7.1 – 7.6)
 *   Cl libre   : 0.4 – 1.4 mg/L  (optimal 0.5 – 1.0)
 *   Cl combiné : ≤ 0.6 mg/L  (nonconforme > 0.8)
 */
export function computeStatus(
  ph: number,
  chloreLibre: number,
  chloreCombine: number | null
): 'conforme' | 'attention' | 'nonconforme' {
  // Normalise chloreCombine : NaN ou undefined → null (non renseigné)
  const cc = (chloreCombine !== null && chloreCombine !== undefined && !isNaN(Number(chloreCombine)))
    ? Number(chloreCombine) : null

  // ── Hors limites réglementaires → NON CONFORME ──────────────────────────
  if (ph < 7.0 || ph > 7.8)              return 'nonconforme'
  if (chloreLibre < 0.4 || chloreLibre > 1.4) return 'nonconforme'
  if (cc !== null && cc > 0.8)           return 'nonconforme'

  // ── Valeurs acceptables mais à surveiller → ATTENTION ───────────────────
  if (ph < 7.1 || ph > 7.6)             return 'attention'
  if (chloreLibre < 0.5)                 return 'attention'
  if (cc !== null && cc > 0.6)           return 'attention'

  // ── Tous les paramètres dans la plage optimale → CONFORME ───────────────
  return 'conforme'
}

/**
 * Retourne la liste des raisons de non-conformité ou d'attention pour affichage UI.
 */
export function getStatusRaisons(
  ph: number,
  chloreLibre: number,
  chloreCombine: number | null
): string[] {
  const cc = (chloreCombine !== null && chloreCombine !== undefined && !isNaN(Number(chloreCombine)))
    ? Number(chloreCombine) : null
  const raisons: string[] = []

  if (ph < 7.0 || ph > 7.8)
    raisons.push(`pH hors limites réglementaires (${ph} — attendu 7.0–7.8)`)
  else if (ph < 7.1 || ph > 7.6)
    raisons.push(`pH hors plage optimale (${ph} — optimal 7.1–7.6)`)

  if (chloreLibre < 0.4)
    raisons.push(`Chlore libre insuffisant (${chloreLibre} mg/L — min régl. 0.4 mg/L)`)
  else if (chloreLibre > 1.4)
    raisons.push(`Chlore libre trop élevé (${chloreLibre} mg/L — max régl. 1.4 mg/L)`)
  else if (chloreLibre < 0.5)
    raisons.push(`Chlore libre en limite basse (${chloreLibre} mg/L — optimal ≥ 0.5 mg/L)`)

  if (cc !== null && cc > 0.8)
    raisons.push(`Chlore combiné trop élevé (${cc} mg/L — max régl. 0.8 mg/L)`)
  else if (cc !== null && cc > 0.6)
    raisons.push(`Chlore combiné élevé (${cc} mg/L — limite recommandée 0.6 mg/L)`)

  return raisons
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
