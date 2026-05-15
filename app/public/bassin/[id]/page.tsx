import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Page publique — accessible sans authentification via QR code
// URL : /public/bassin/[id]

export default async function PublicBassinPage({ params }: { params: { id: string } }) {
  const bassinId = parseInt(params.id)
  if (isNaN(bassinId)) notFound()

  const [bassin, etablissement, dernierReleve] = await Promise.all([
    prisma.bassin.findUnique({ where: { id: bassinId } }).catch(() => null),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
    prisma.releve.findFirst({
      where: { bassinId, valide: true },
      orderBy: [{ date: 'desc' }, { heure: 'desc' }],
    }).catch(() => null),
  ])

  if (!bassin) notFound()

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const statusInfo = dernierReleve
    ? dernierReleve.status === 'conforme'
      ? { emoji: '✅', label: 'EAU CONFORME', color: '#10b981', bg: '#f0fdf4', borderColor: '#bbf7d0' }
      : dernierReleve.status === 'attention'
      ? { emoji: '⚠️', label: 'ATTENTION', color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a' }
      : { emoji: '🚨', label: 'NON CONFORME', color: '#dc2626', bg: '#fff5f5', borderColor: '#fca5a5' }
    : null

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Qualité de l'eau — {bassin.nom}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f9ff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
          .container { max-width: 400px; width: 100%; }
          .header { text-align: center; margin-bottom: 24px; }
          .brand { font-size: 12px; font-weight: 700; color: #00aeef; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
          .bassin-name { font-size: 26px; font-weight: 800; color: #1a1a2e; }
          .etab-name { font-size: 13px; color: #64748b; margin-top: 4px; }
          .status-card { border-radius: 16px; padding: 32px 24px; text-align: center; margin-bottom: 20px; border: 2px solid; }
          .status-emoji { font-size: 64px; margin-bottom: 12px; }
          .status-label { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
          .status-date { font-size: 12px; color: #64748b; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .metric { background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
          .metric-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 6px; }
          .metric-val { font-size: 28px; font-weight: 800; font-family: 'Courier New', monospace; }
          .metric-unit { font-size: 10px; color: #94a3b8; margin-top: 2px; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.8; }
          .no-data { background: #f8fafc; border-radius: 16px; padding: 48px 24px; text-align: center; }
          .no-data-emoji { font-size: 48px; margin-bottom: 12px; }
          .no-data-title { font-size: 18px; font-weight: 700; color: #64748b; }
          .no-data-sub { font-size: 13px; color: #94a3b8; margin-top: 8px; }
          .validated-by { font-size: 11px; color: #64748b; margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.7); border-radius: 8px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div className="brand">🏊 Carnet Sanitaire</div>
            <div className="bassin-name">{bassin.nom}</div>
            {etablissement && <div className="etab-name">{etablissement.nom}</div>}
          </div>

          {dernierReleve && statusInfo ? (
            <>
              <div className="status-card" style={{ background: statusInfo.bg, borderColor: statusInfo.borderColor }}>
                <div className="status-emoji">{statusInfo.emoji}</div>
                <div className="status-label" style={{ color: statusInfo.color }}>{statusInfo.label}</div>
                <div className="status-date">Dernière analyse validée le {dernierReleve.date.split('-').reverse().join('/')} à {dernierReleve.heure}</div>
                {dernierReleve.valideePar && (
                  <div className="validated-by">✅ Validé par {dernierReleve.valideePar}</div>
                )}
              </div>

              <div className="metrics">
                <div className="metric">
                  <div className="metric-label">pH</div>
                  <div className="metric-val" style={{ color: dernierReleve.ph >= 7.1 && dernierReleve.ph <= 7.6 ? '#10b981' : dernierReleve.ph <= 7.8 ? '#d97706' : '#dc2626' }}>
                    {dernierReleve.ph}
                  </div>
                  <div className="metric-unit">7.1 – 7.6</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Chlore libre</div>
                  <div className="metric-val" style={{ color: dernierReleve.chloreLibre >= 0.4 && dernierReleve.chloreLibre <= 1.4 ? '#10b981' : '#dc2626' }}>
                    {dernierReleve.chloreLibre}
                  </div>
                  <div className="metric-unit">mg/L</div>
                </div>
                {dernierReleve.turbidite !== null && (
                  <div className="metric">
                    <div className="metric-label">Turbidité</div>
                    <div className="metric-val" style={{ color: dernierReleve.turbidite <= 0.5 ? '#10b981' : dernierReleve.turbidite <= 1 ? '#d97706' : '#dc2626' }}>
                      {dernierReleve.turbidite}
                    </div>
                    <div className="metric-unit">NTU</div>
                  </div>
                )}
                <div className="metric">
                  <div className="metric-label">T° eau</div>
                  <div className="metric-val" style={{ color: '#1a1a2e' }}>
                    {dernierReleve.tempEau}°
                  </div>
                  <div className="metric-unit">Celsius</div>
                </div>
                {dernierReleve.redox !== null && (
                  <div className="metric">
                    <div className="metric-label">Redox</div>
                    <div className="metric-val" style={{ color: dernierReleve.redox >= 650 ? '#10b981' : dernierReleve.redox >= 600 ? '#d97706' : '#dc2626', fontSize: 22 }}>
                      {dernierReleve.redox}
                    </div>
                    <div className="metric-unit">mV</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-data">
              <div className="no-data-emoji">🕐</div>
              <div className="no-data-title">Aucune analyse disponible</div>
              <div className="no-data-sub">Aucun relevé validé n'est encore disponible pour ce bassin aujourd'hui.</div>
            </div>
          )}

          <div className="footer">
            Carnet Sanitaire Numérique CIFEC<br />
            Conforme à l'arrêté du 26/05/2021<br />
            {today}
          </div>
        </div>
      </body>
    </html>
  )
}
