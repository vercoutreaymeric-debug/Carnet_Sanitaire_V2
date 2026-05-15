import { prisma } from '@/lib/prisma'
import PrintActions from '../releves/PrintActions'
export const dynamic = 'force-dynamic'

export default async function PreviewFrequentation({
  searchParams,
}: {
  searchParams: { from?: string; to?: string }
}) {
  const [data, etablissement] = await Promise.all([
    prisma.frequentation.findMany({ orderBy: { date: 'asc' } }).catch(() => []),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const from = searchParams.from
  const to = searchParams.to

  const filtered = data.filter(f => {
    if (from && f.date < from) return false
    if (to && f.date > to) return false
    return true
  })

  const totalBaigneurs = filtered.reduce((s, f) => s + f.total, 0)
  const moyenneBaigneurs = filtered.length > 0 ? Math.round(totalBaigneurs / filtered.length) : 0
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
    .kpis { display: flex; gap: 3mm; margin-bottom: 5mm; }
    .kpi { flex: 1; border-radius: 6px; padding: 10px 12px; text-align: center; }
    .kpi label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px; }
    .kpi span { font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; font-size: 10px; }
    thead th { background: #00aeef; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
    .mono { font-family: 'Courier New', monospace; }
    .center { text-align: center; }
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
          <h1>Registre de fréquentation et apport en eau</h1>
          <p>Document officiel — À conserver 3 ans (Art. D.1332-10 du Code de la Santé Publique)</p>
        </div>

        <div className="kpis">
          <div className="kpi" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <label>Total baigneurs</label>
            <span>{totalBaigneurs}</span>
          </div>
          <div className="kpi" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <label>Moyenne / jour</label>
            <span>{moyenneBaigneurs}</span>
          </div>
          <div className="kpi" style={{ background: '#faf5ff', color: '#7c3aed' }}>
            <label>Jours enregistrés</label>
            <span>{filtered.length}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px', fontStyle: 'italic' }}>Aucune donnée pour cette période</p>
        ) : (
          <table>
            <thead>
              <tr>
                {['Date', 'Scolaire', 'Club', 'Public', 'Total', 'Report eau (m³)', 'Relevé eau (m³)', 'Eau ajoutée (m³)', 'L/baigneur'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td className="mono">{f.date}</td>
                  <td className="center">{f.scolaire ?? '—'}</td>
                  <td className="center">{f.club ?? '—'}</td>
                  <td className="center">{f.publicCount ?? '—'}</td>
                  <td className="center" style={{ fontWeight: 700 }}>{f.total}</td>
                  <td className="mono center">{f.reportEau ?? '—'}</td>
                  <td className="mono center">{f.releveEau ?? '—'}</td>
                  <td className="mono center">{f.totalEau ?? '—'}</td>
                  <td className="mono center" style={{ color: (f.litresParBaigneur ?? 0) >= 30 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                    {f.litresParBaigneur ?? '—'}
                  </td>
                </tr>
              ))}
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
