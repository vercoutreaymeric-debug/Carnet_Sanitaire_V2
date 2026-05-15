import nodemailer from 'nodemailer'

// ── Transport SMTP ────────────────────────────────────────────────────────────
export function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   ?? 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
  })
}

// ── Envoi d'un email ──────────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
  const transporter = createTransport()
  const from = `"Carnet Sanitaire CIFEC" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`
  return transporter.sendMail({ from, to, subject, html })
}

// ── Template email — alerte relevé manquant ───────────────────────────────────
export function templateReleveManquant(date: string, etabNom: string, appUrl: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alerte Carnet Sanitaire</title>
</head>
<body style="margin:0;padding:0;background:#f0f6fc;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6fc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,120,180,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#00c4ff 0%,#0077aa 100%);padding:28px 32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 20px;margin-bottom:12px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:0.1em;">CIFEC</span>
            </div>
            <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">Carnet Sanitaire Numérique</h1>
          </td>
        </tr>

        <!-- Alerte -->
        <tr>
          <td style="padding:32px;">

            <div style="background:#fff8e1;border:1px solid #fbbf24;border-left:4px solid #f59e0b;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:24px;">⚠️</span>
              <div>
                <p style="margin:0;font-size:15px;font-weight:700;color:#92400e;">Relevé manquant</p>
                <p style="margin:4px 0 0;font-size:13px;color:#b45309;">Aucun relevé de qualité d'eau n'a été saisi pour le <strong>${date}</strong></p>
              </div>
            </div>

            <p style="font-size:14px;color:#3a5a6e;line-height:1.7;margin:0 0 16px;">
              Bonjour,<br/><br/>
              Le carnet sanitaire de <strong>${etabNom}</strong> ne contient aucun relevé pour la date du <strong>${date}</strong>.
            </p>

            <p style="font-size:14px;color:#3a5a6e;line-height:1.7;margin:0 0 24px;">
              Conformément à l'<strong>Arrêté du 26 mai 2021</strong> (NOR:SSAP2004757A), les mesures de qualité de l'eau doivent être effectuées et enregistrées chaque jour d'ouverture au public.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:28px 0;">
              <a href="${appUrl}/releves" style="display:inline-block;background:linear-gradient(135deg,#00c4ff,#0077aa);color:#fff;text-decoration:none;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                Saisir un relevé maintenant →
              </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
              Cet email a été envoyé automatiquement par le Carnet Sanitaire CIFEC.<br/>
              Ne pas répondre à cet email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0e4f6e;padding:16px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:0;">
              CIFEC — Carnet Sanitaire Numérique · Arrêté du 26 mai 2021
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
