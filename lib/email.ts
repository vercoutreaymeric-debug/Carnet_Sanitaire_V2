import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

interface AlerteParams {
  status: 'attention' | 'nonconforme'
  bassinNom: string
  date: string
  heure: string
  saisiPar: string
  etablissementNom: string
  valeurs: { parametre: string; valeur: string; norme: string; ok: boolean }[]
  destinataires: string[]
}

export async function envoyerAlerteReleve(p: AlerteParams) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return // email non configuré

  const isNonConforme = p.status === 'nonconforme'
  const couleur = isNonConforme ? '#dc2626' : '#d97706'
  const bgCouleur = isNonConforme ? '#7f1d1d' : '#78350f'
  const emoji = isNonConforme ? '🚨' : '⚠️'
  const titre = isNonConforme ? 'Relevé NON CONFORME — Action requise' : 'Relevé en situation d\'Attention'
  const sujet = isNonConforme
    ? `🚨 [Carnet Sanitaire] NON CONFORME — ${p.bassinNom} ${p.date}`
    : `⚠️ [Carnet Sanitaire] Attention — ${p.bassinNom} ${p.date}`

  const lignesValeurs = p.valeurs.map(v => `
    <tr style="${!v.ok ? 'background:#fff5f5' : ''}">
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:${!v.ok ? '700' : '400'}">${v.parametre}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-weight:700;color:${!v.ok ? couleur : '#111'}">${v.valeur}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#6b7280">${v.norme}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:700;color:${!v.ok ? couleur : '#10b981'}">${!v.ok ? '✕ Hors norme' : '✓ OK'}</td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#e5e7eb;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden">
  <div style="background:${bgCouleur};padding:20px 24px">
    <div style="color:#fff;font-size:18px;font-weight:700">${emoji} Carnet Sanitaire — ${isNonConforme ? 'Non conforme' : 'Alerte Attention'}</div>
    <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:4px">${p.etablissementNom} · ${p.date} ${p.heure}</div>
  </div>
  <div style="padding:24px">
    <div style="background:${isNonConforme ? '#fee2e2' : '#fff7ed'};border:1px solid ${isNonConforme ? '#fca5a5' : '#fed7aa'};border-radius:8px;padding:14px 18px;margin-bottom:16px">
      <div style="font-weight:700;color:${couleur};font-size:14px;margin-bottom:4px">${emoji} ${titre}</div>
      <div style="font-size:12px;color:${isNonConforme ? '#7f1d1d' : '#9a3412'}">
        Le relevé saisi sur <strong>${p.bassinNom}</strong> le ${p.date} à ${p.heure}
        ${isNonConforme ? 'présente des valeurs <strong>hors normes réglementaires</strong>. Une intervention immédiate peut être nécessaire.' : 'nécessite votre attention. Certaines valeurs sont proches des limites réglementaires.'}
      </div>
    </div>
    <div style="font-size:12px;color:#374151;margin-bottom:10px;font-weight:600">Valeurs relevées :</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr>
          <th style="background:#f8fafc;padding:7px 10px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0">Paramètre</th>
          <th style="background:#f8fafc;padding:7px 10px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0">Valeur</th>
          <th style="background:#f8fafc;padding:7px 10px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0">Norme</th>
          <th style="background:#f8fafc;padding:7px 10px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0">Statut</th>
        </tr>
      </thead>
      <tbody>${lignesValeurs}</tbody>
    </table>
    <div style="font-size:11px;color:#6b7280;margin-top:12px">Saisi par : <strong>${p.saisiPar}</strong></div>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/releves"
       style="display:inline-block;background:${couleur};color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;margin-top:16px">
      Voir le relevé →
    </a>
  </div>
  <div style="background:#f8fafc;padding:14px 24px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
    Carnet Sanitaire Numérique CIFEC · ${p.etablissementNom} · Ne pas répondre à cet email
  </div>
</div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"Carnet Sanitaire CIFEC" <${process.env.SMTP_USER}>`,
      to: p.destinataires.join(', '),
      subject: sujet,
      html,
    })
  } catch (err) {
    console.error('[email] Erreur envoi alerte:', err)
  }
}
