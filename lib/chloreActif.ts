/**
 * Calcul du Chlore Libre Actif selon la formule réglementaire CIFEC
 * https://www.cifec.fr/calcul-du-chlore-actif
 *
 * @param chloreLibre  - Chlore libre DPD1 (mg/L)
 * @param ph           - pH mesuré
 * @param temperature  - Température de l'eau (°C)
 * @param mineralisation - 'normale' | 'forte'
 */
export function calcChloreActif(
  chloreLibre: number,
  ph: number,
  temperature: number,
  mineralisation: 'normale' | 'forte' = 'normale'
): number | null {
  try {
    const FI = mineralisation === 'forte' ? 0.1 : 0.01
    const T = temperature
    const Ka = Math.pow(10, -((3000 / (T + 273)) - 10.0686 + 0.0253 * (T + 273)))
    const fCL = Math.pow(10, -(0.5211 * (Math.sqrt(FI) / (1 + Math.sqrt(FI)) - 0.3 * FI)))
    const chloreActif = chloreLibre * Math.pow(1 + Ka / (fCL * Math.pow(10, -ph)), -1)
    return Math.round(chloreActif * 1000) / 1000
  } catch {
    return null
  }
}
