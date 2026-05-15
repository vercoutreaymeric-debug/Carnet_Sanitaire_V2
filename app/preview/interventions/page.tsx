import { prisma } from '@/lib/prisma'
import PrintActions from '../releves/PrintActions'
export const dynamic = 'force-dynamic'

const typeColors: Record<string, { color: string; bg: string }> = {
  Incident:      { color: '#d97706', bg: '#fef3c7' },
  Maintenance:   { color: '#2563eb', bg: '#eff6ff' },
  Observation:   { color: '#6b7280', bg: '#f3f4f6' },
  Vérification:  { color: '#16a34a', bg: '#dcfce7' },
}

export default async function PreviewInterventions({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; type?: string }
}) {
  const [data, etablissement] = await Promise.all([
    prisma.intervention.findMany({ orderBy: [{ date: 'desc' }] }).catch(() => []),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const from = searchParams.from
  const to = searchParams.to
  const typeFilter = searchParams.type

  const filtered = data.filter(i => {
    if (from && i.date < from) return false
    if (to && i.date > to) return false
    if (typeFilter && typeFilter !== 'Tous' && i.type !== typeFilter) return false
    return true
  })

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const enCours = filtered.filter(i => i.status === 'en cours').length
  const resolus = filtered.filter(i => i.status === 'résolu' || i.status === 'clôturé').length

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
    .kpis { display: flex; gap: 3mm; margin-bottom: 5mm; }
    .kpi { flex: 1; border-radius: 6px; padding: 10px 12px; text-align: center; }
    .kpi label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px; }
    .kpi span { font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; font-size: 10px; }
    thead th { background: #00aeef; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
    .mono { font-family: 'Courier New', monospace; }
    .desc { max-width: 200px; line-height: 1.4; }
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
          <h1>Registre des interventions et incidents</h1>
          <p>Document officiel — Art. 4 de l'arrêté du 26/05/2021</p>
        </div>

        <div className="kpis">
          <div className="kpi" style={{ background: '#f3f4f6', color: '#374151' }}>
            <label>Total</label>
            <span>{filtered.length}</span>
          </div>
          <div className="kpi" style={{ background: '#fef3c7', color: '#d97706' }}>
            <label>En cours</label>
            <span>{enCours}</span>
          </div>
          <div className="kpi" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <label>Résolus</label>
            <span>{resolus}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px', fontStyle: 'italic' }}>Aucune intervention pour cette période</p>
        ) : (
          <table>
            <thead>
              <tr>
                {['Date', 'Heure', 'Type', 'Bassin', 'Description', 'Agent', 'Statut'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const tc = typeColors[i.type] ?? { color: '#374151', bg: '#f3f4f6' }
                return (
                  <tr key={i.id}>
                    <td className="mono">{i.date}</td>
                    <td className="mono">{i.heure ?? '—'}</td>
                    <td><span className="badge" style={{ background: tc.bg, color: tc.color }}>{i.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{i.bassin}</td>
                    <td className="desc">{i.description}</td>
                    <td>{i.agent ?? '—'}</td>
                    <td><span className="badge" style={{ background: i.status === 'résolu' || i.status === 'clôturé' ? '#dcfce7' : '#fef3c7', color: i.status === 'résolu' || i.status === 'clôturé' ? '#16a34a' : '#d97706' }}>{i.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
