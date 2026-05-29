import { prisma } from '@/lib/prisma'
import PrintActions from '../releves/PrintActions'
export const dynamic = 'force-dynamic'

export default async function PreviewBassins() {
  const [bassins, etablissement] = await Promise.all([
    prisma.bassin.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => []),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #e5e7eb; }
    .page { width: 210mm; margin: 8mm auto; background: #fff; padding: 14mm 12mm; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; padding-bottom: 5mm; border-bottom: 2.5px solid #00aeef; }
    .logo { width: 52px; height: 52px; object-fit: contain; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-title { font-size: 20px; font-weight: 700; color: #00aeef; }
    .header-sub { font-size: 10px; color: #888; margin-top: 3px; }
    .header-right { text-align: right; font-size: 10px; color: #666; line-height: 1.8; }
    .doc-title { text-align: center; margin-bottom: 6mm; }
    .doc-title h1 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .doc-title p { font-size: 10px; color: #888; margin-top: 3px; }
    .bassin-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; margin-bottom: 5mm; break-inside: avoid; }
    .bassin-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
    .bassin-title { font-size: 14px; font-weight: 700; color: #00aeef; }
    .bassin-type { font-size: 10px; color: #888; background: #f0f9ff; padding: 2px 8px; border-radius: 10px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .metric { background: #f9fafb; border-radius: 6px; padding: 8px 10px; }
    .metric label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; display: block; margin-bottom: 2px; }
    .metric span { font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace; }
    .traitement-row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .traitement-badge { font-size: 9px; font-weight: 700; padding: 3px 9px; border-radius: 10px; }
    .mesure-label { font-size: 9px; color: #666; margin-top: 6px; padding: 4px 10px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #00aeef; }
    .footer { margin-top: 6mm; padding-top: 4mm; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-text { font-size: 9px; color: #aaa; line-height: 1.8; }
    .signature { border-top: 1px solid #333; width: 52mm; text-align: center; padding-top: 3px; font-size: 9px; color: #666; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { box-shadow: none; margin: 0; width: 100%; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <PrintActions />
      <div className="page">
        <div className="header">
          <div className="header-left">
            <img src="/assets/logo-cifec.png" alt="CIFEC" className="logo" />
            <div>
              <div className="header-title">Carnet Sanitaire</div>
              <div className="header-sub">Arrêté du 26 mai 2021 — NOR:SSAP2004757A</div>
            </div>
          </div>
          <div className="header-right">
            <strong style={{ fontSize: 12, color: '#1a1a2e' }}>{etablissement?.nom ?? 'Établissement'}</strong><br />
            {etablissement?.adresse}<br />
            {etablissement?.telephone}<br />
            Édité le {today}
          </div>
        </div>

        <div className="doc-title">
          <h1>Dossier technique des bassins</h1>
          <p>Caractéristiques techniques — Arrêté du 26 mai 2021</p>
        </div>

        {bassins.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px', fontStyle: 'italic' }}>Aucun bassin enregistré</p>
        ) : (
          bassins.map(b => (
            <div key={b.id} className="bassin-card">
              <div className="bassin-header">
                <div className="bassin-title">{b.nom}</div>
                <div className="bassin-type">Bassin {b.type}</div>
              </div>
              <div className="metrics">
                <div className="metric"><label>Longueur</label><span>{b.longueur ? `${b.longueur} m` : '—'}</span></div>
                <div className="metric"><label>Largeur</label><span>{b.largeur ? `${b.largeur} m` : '—'}</span></div>
                <div className="metric"><label>Prof. min</label><span>{b.profMin ? `${b.profMin} m` : '—'}</span></div>
                <div className="metric"><label>Prof. max</label><span>{b.profMax ? `${b.profMax} m` : '—'}</span></div>
                <div className="metric"><label>Surf. ≥1.5m</label><span>{b.surfSuperieure ? `${b.surfSuperieure} m²` : '—'}</span></div>
                <div className="metric"><label>Surf. &lt;1.5m</label><span>{b.surfInferieure ? `${b.surfInferieure} m²` : '—'}</span></div>
                <div className="metric"><label>Volume total</label><span>{b.volumeTotal ? `${b.volumeTotal} m³` : '—'}</span></div>
                <div className="metric"><label>Débit régl.</label><span>{b.debitReglementaire ? `${b.debitReglementaire} m³/h` : '—'}</span></div>
                <div className="metric"><label>Débit install.</label><span>{b.debitInstallation ? `${b.debitInstallation} m³/h` : '—'}</span></div>
              </div>

              {/* Traitement & Mesure */}
              {(b.traitementPrincipal || b.typeMesure) && (
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e5e7eb' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 6 }}>Traitement &amp; Mesure</div>
                  <div className="traitement-row">
                    {b.traitementPrincipal && (() => {
                      const colors: Record<string, { bg: string; color: string }> = {
                        'Chlore': { bg: '#e0f2fe', color: '#0369a1' },
                        'Brome': { bg: '#fef3c7', color: '#92400e' },
                        'PHMB': { bg: '#ede9fe', color: '#5b21b6' },
                        'Sel/Électrolyse': { bg: '#d1fae5', color: '#065f46' },
                        'UV': { bg: '#fce7f3', color: '#9d174d' },
                        'Minéralisation': { bg: '#cffafe', color: '#155e75' },
                      }
                      const c = colors[b.traitementPrincipal] ?? { bg: '#f3f4f6', color: '#374151' }
                      return (
                        <span className="traitement-badge" style={{ background: c.bg, color: c.color }}>
                          Traitement : {b.traitementPrincipal}{b.typeStabilisant ? ` · ${b.typeStabilisant}` : ''}
                        </span>
                      )
                    })()}
                    {b.typeMesure && (
                      <span className="traitement-badge" style={{
                        background: b.typeMesure === 'ponctuelle' ? '#d1fae5' : '#fef3c7',
                        color: b.typeMesure === 'ponctuelle' ? '#065f46' : '#92400e',
                      }}>
                        Mesure : {b.typeMesure === 'ponctuelle' ? 'Réglementaire (ponctuelle)' : 'Analyse en continu'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="footer">
          <div className="footer-text">
            Généré par le Carnet Sanitaire Numérique CIFEC<br />
            Conforme à l'arrêté du 26/05/2021 — Art. D.1332-1 et D.1332-10 du Code de la Santé Publique<br />
            {today}
          </div>
          <div className="signature">Signature du responsable</div>
        </div>
      </div>
    </>
  )
}
