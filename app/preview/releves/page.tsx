import { prisma } from '@/lib/prisma'
import PrintActions from './PrintActions'
export const dynamic = 'force-dynamic'

function statusLabel(s: string) {
  if (s === 'conforme') return { label: 'Conforme', color: '#16a34a', bg: '#dcfce7' }
  if (s === 'attention') return { label: 'Attention', color: '#d97706', bg: '#fef3c7' }
  return { label: 'Non conforme', color: '#dc2626', bg: '#fee2e2' }
}

export default async function PreviewReleves({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; bassin?: string; valide?: string }
}) {
  const [releves, etablissement] = await Promise.all([
    prisma.releve.findMany({ orderBy: [{ date: 'asc' }, { heure: 'asc' }] }).catch(() => []),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const from = searchParams.from
  const to = searchParams.to
  const bassinFilter = searchParams.bassin

  const valideFilter = searchParams.valide

  const filtered = releves.filter(r => {
    if (from && r.date < from) return false
    if (to && r.date > to) return false
    if (bassinFilter && bassinFilter !== 'Tous' && r.bassinNom !== bassinFilter) return false
    if (valideFilter === 'true' && !r.valide) return false
    return true
  })

  const conformes = filtered.filter(r => r.status === 'conforme').length
  const attention = filtered.filter(r => r.status === 'attention').length
  const nonConformes = filtered.filter(r => r.status === 'nonconforme').length
  const valides = filtered.filter(r => r.valide).length
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const css = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #e5e7eb; }
    .page { width: 297mm; margin: 8mm auto; background: #fff; padding: 12mm 10mm; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; padding-bottom: 5mm; border-bottom: 2.5px solid #00aeef; }
    .logo { width: 52px; height: 52px; object-fit: contain; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-title { font-size: 20px; font-weight: 700; color: #00aeef; }
    .header-sub { font-size: 10px; color: #888; margin-top: 3px; }
    .header-right { text-align: right; font-size: 10px; color: #666; line-height: 1.8; }
    .doc-title { text-align: center; margin-bottom: 6mm; }
    .doc-title h1 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .doc-title p { font-size: 10px; color: #888; margin-top: 3px; }
    .info-band { display: flex; gap: 4mm; margin-bottom: 5mm; }
    .info-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; background: #f9fafb; }
    .info-box label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; display: block; margin-bottom: 2px; }
    .info-box span { font-size: 13px; font-weight: 700; }
    .kpis { display: flex; gap: 3mm; margin-bottom: 5mm; }
    .kpi { flex: 1; border-radius: 6px; padding: 8px; text-align: center; }
    .kpi label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 3px; }
    .kpi span { font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; font-size: 8.5px; }
    thead th { background: #00aeef; color: #fff; padding: 5px 5px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 4px 5px; border-bottom: 1px solid #f0f0f0; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
    .mono { font-family: 'Courier New', monospace; }
    .center { text-align: center; }
    .footer { margin-top: 6mm; padding-top: 4mm; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-text { font-size: 9px; color: #aaa; line-height: 1.8; }
    .signature { border-top: 1px solid #333; width: 52mm; text-align: center; padding-top: 3px; font-size: 9px; color: #666; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { box-shadow: none; margin: 0; width: 100%; }
      @page { size: A4 landscape; margin: 10mm; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <PrintActions />
      <div className="page">
        {/* En-tête */}
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

        {/* Titre */}
        <div className="doc-title">
          <h1>Relevés journaliers de qualité de l'eau</h1>
          <p>Document officiel — À conserver 3 ans (Art. D.1332-10 du Code de la Santé Publique)</p>
        </div>

        {/* Infos */}
        <div className="info-band">
          <div className="info-box">
            <label>Période</label>
            <span>{from && to ? `${new Date(from).toLocaleDateString('fr-FR')} → ${new Date(to).toLocaleDateString('fr-FR')}` : 'Tous les relevés'}</span>
          </div>
          <div className="info-box">
            <label>Bassin</label>
            <span>{bassinFilter && bassinFilter !== 'Tous' ? bassinFilter : 'Tous les bassins'}</span>
          </div>
          <div className="info-box">
            <label>Total relevés</label>
            <span>{filtered.length}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpis">
          <div className="kpi" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <label>Conformes</label>
            <span>{conformes}</span>
          </div>
          <div className="kpi" style={{ background: '#fef3c7', color: '#d97706' }}>
            <label>Attention</label>
            <span>{attention}</span>
          </div>
          <div className="kpi" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <label>Non conformes</label>
            <span>{nonConformes}</span>
          </div>
          <div className="kpi" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <label>Taux conformité</label>
            <span>{filtered.length > 0 ? Math.round((conformes / filtered.length) * 100) : 0}%</span>
          </div>
          <div className="kpi" style={{ background: '#d1fae5', color: '#065f46' }}>
            <label>Validés</label>
            <span>{valides}/{filtered.length}</span>
          </div>
        </div>

        {/* Tableau */}
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px', fontStyle: 'italic' }}>Aucun relevé pour cette période</p>
        ) : (
          <table>
            <thead>
              <tr>
                {[
                  'Date', 'Heure', 'Bassin', 'Transparence',
                  'T° eau', 'T° air',
                  'pH', 'Cl libre\n(mg/L)', 'Cl combiné\n(mg/L)', 'Cl total\n(mg/L)',
                  'Turbidité\n(NTU)', 'Redox\n(mV)',
                  'TH (°f)', 'TAC (°f)',
                  'Cyanurate\n(mg/L)', 'Chlorure\n(mg/L)',
                  'Statut', 'Validation'
                ].map(h => (
                  <th key={h} style={{ whiteSpace: 'pre-line', lineHeight: 1.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = statusLabel(r.status)
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.date}</td>
                    <td className="mono center">{r.heure ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{r.bassinNom}</td>
                    <td>{r.transparence ?? '—'}</td>
                    <td className="mono center">{r.tempEau ? `${r.tempEau}°` : '—'}</td>
                    <td className="mono center">{r.tempAir ? `${r.tempAir}°` : '—'}</td>
                    <td className="mono center" style={{ fontWeight: 700, color: r.ph >= 7.1 && r.ph <= 7.6 ? '#16a34a' : r.ph <= 7.8 ? '#d97706' : '#dc2626' }}>{r.ph}</td>
                    <td className="mono center" style={{ fontWeight: 700, color: r.chloreLibre >= 0.4 && r.chloreLibre <= 1.4 ? '#16a34a' : '#dc2626' }}>{r.chloreLibre}</td>
                    <td className="mono center" style={{ color: (r.chloreCombine ?? 0) < 0.6 ? '#16a34a' : (r.chloreCombine ?? 0) < 0.8 ? '#d97706' : '#dc2626' }}>{r.chloreCombine ?? '—'}</td>
                    <td className="mono center">{r.chloreTotal ?? '—'}</td>
                    <td className="mono center" style={{ color: r.turbidite !== null ? (r.turbidite <= 0.5 ? '#16a34a' : r.turbidite <= 1 ? '#d97706' : '#dc2626') : undefined }}>{r.turbidite ?? '—'}</td>
                    <td className="mono center" style={{ color: r.redox !== null ? (r.redox >= 650 ? '#16a34a' : r.redox >= 600 ? '#d97706' : '#dc2626') : undefined }}>{r.redox ?? '—'}</td>
                    <td className="mono center">{r.th ?? '—'}</td>
                    <td className="mono center">{r.tac ?? '—'}</td>
                    <td className="mono center">{r.cyanurate ?? '—'}</td>
                    <td className="mono center">{r.tauxChlorure ?? '—'}</td>
                    <td><span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span></td>
                    <td>
                      {r.valide
                        ? <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>✅ {r.valideePar ?? 'Validé'}</span>
                        : <span className="badge" style={{ background: '#fef9c3', color: '#854d0e' }}>⏳ En attente</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Footer */}
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
