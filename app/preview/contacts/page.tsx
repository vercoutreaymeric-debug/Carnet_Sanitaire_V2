import { prisma } from '@/lib/prisma'
import PrintActions from '../releves/PrintActions'
export const dynamic = 'force-dynamic'

const CATEGORIES = ['Urgences', 'Administration', 'Services', 'Technique']

export default async function PreviewContacts() {
  const [contacts, etablissement] = await Promise.all([
    prisma.contact.findMany({ orderBy: { id: 'asc' } }).catch(() => []),
    prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const catColors: Record<string, { color: string; bg: string }> = {
    Urgences:       { color: '#dc2626', bg: '#fee2e2' },
    Administration: { color: '#2563eb', bg: '#eff6ff' },
    Services:       { color: '#16a34a', bg: '#dcfce7' },
    Technique:      { color: '#d97706', bg: '#fef3c7' },
  }

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
    .cat-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin: 5mm 0 2mm; display: flex; align-items: center; gap: 6px; }
    .cat-badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; font-size: 10px; break-inside: avoid; }
    thead th { padding: 5px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #fff; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
    .mono { font-family: 'Courier New', monospace; font-weight: 600; }
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
          <h1>Annuaire des contacts importants</h1>
          <p>Numéros d'urgence et contacts utiles de l'établissement</p>
        </div>

        {CATEGORIES.filter(cat => contacts.some(c => c.categorie === cat)).map(cat => {
          const cc = catColors[cat] ?? { color: '#374151', bg: '#f3f4f6' }
          const list = contacts.filter(c => c.categorie === cat)
          return (
            <div key={cat}>
              <div className="cat-title">
                <span className="cat-badge" style={{ background: cc.bg, color: cc.color }}>{cat}</span>
              </div>
              <table>
                <thead>
                  <tr style={{ background: cc.color }}>
                    {['Nom / Service', 'Adresse / Responsable', 'Tél. bureau', 'Tél. domicile'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.nom}</td>
                      <td style={{ color: '#666' }}>{c.adresse || c.responsable || '—'}</td>
                      <td className="mono">{c.bureau || '—'}</td>
                      <td className="mono">{c.domicile || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        <div className="footer">
          <div className="footer-text">
            Généré par le Carnet Sanitaire Numérique CIFEC<br />
            Centre anti-poisons : Hôpital Fernand-Widal, 200 r. Fbg Saint-Denis 75010 Paris · 01 40 05 48 48<br />
            {today}
          </div>
          <div className="signature">Signature du responsable</div>
        </div>
      </div>
    </>
  )
}
