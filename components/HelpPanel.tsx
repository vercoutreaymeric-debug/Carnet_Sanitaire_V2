'use client'
import { useState } from 'react'

const helpContent: Record<string, { title: string; intro: string; sections: { icon: string; title: string; text: string }[] }> = {
  dashboard: {
    title: 'Tableau de bord',
    intro: "Vue d'ensemble de l'état sanitaire de votre établissement en temps réel.",
    sections: [
      { icon: '📊', title: 'Indicateurs clés', text: 'Les 4 cartes affichent : baigneurs du jour, taux de conformité, alertes en attente, interventions du mois.' },
      { icon: '🔴', title: 'Bandeau d\'alerte', text: 'Si un relevé est non conforme, un bandeau rouge apparaît. La baignade ne peut pas être autorisée tant que les valeurs ne sont pas dans les normes.' },
      { icon: '💧', title: 'Derniers relevés', text: 'Affiche les relevés les plus récents avec leur statut de conformité.' },
      { icon: '📋', title: 'Valeurs limites', text: "Rappel des seuils réglementaires issus de l'arrêté du 26 mai 2021 (NOR:SSAP2004757A)." },
    ],
  },
  releves: {
    title: 'Relevés journaliers',
    intro: "Saisie et consultation des mesures qualité de l'eau — obligatoire selon l'arrêté du 26/05/2021.",
    sections: [
      { icon: '📅', title: 'Fréquence', text: 'Minimum une fois par jour, de préférence avant ouverture. En cas de forte fréquentation, un second relevé est recommandé.' },
      { icon: '🧪', title: 'Paramètres', text: 'pH (7.1–7.6), Chlore libre (0.4–1.4 mg/L), Chlore combiné (<0.6 mg/L), Température eau (<30°C), TH (≥10°f), TAC (≥9°f).' },
      { icon: '🟢', title: 'Statut', text: 'Calculé automatiquement : Conforme (tous OK), Attention (valeurs limites), Non conforme (action corrective requise).' },
      { icon: '✏️', title: 'Saisie', text: 'Cliquez sur "Nouveau relevé", sélectionnez le bassin, saisissez les mesures. Le statut est calculé en temps réel.' },
    ],
  },
  frequentation: {
    title: 'Fréquentation',
    intro: 'Suivi du nombre de baigneurs et calcul du volume de renouvellement obligatoire.',
    sections: [
      { icon: '👥', title: 'Catégories', text: 'Distinguez Scolaires, Club et Public. Le total est calculé automatiquement.' },
      { icon: '💧', title: 'Apport en eau', text: "La réglementation impose un minimum de 30 L d'eau neuve par baigneur et par jour." },
      { icon: '⚠️', title: 'Volume minimum', text: "Si le volume par baigneur est inférieur à 30 L, un indicateur orange apparaît — vous êtes en infraction." },
    ],
  },
  interventions: {
    title: 'Interventions & Incidents',
    intro: "Journal obligatoire selon l'article 4 de l'arrêté du 26 mai 2021.",
    sections: [
      { icon: '📝', title: 'Que consigner ?', text: 'Toute intervention technique, incident, observation ou vérification : panne, traitement correctif, inspection ARS, fermeture préventive...' },
      { icon: '🔴', title: 'Types', text: 'Incident (problème qualité/sécurité), Maintenance (travaux), Observation (constat), Vérification (contrôle réglementaire).' },
      { icon: '👁️', title: 'Consultable ARS', text: "Ce journal est un document officiel du carnet sanitaire. Il doit être présenté à toute inspection de l'ARS." },
    ],
  },
  bassins: {
    title: 'Dossier technique des bassins',
    intro: "Fiche technique de chaque bassin — données permanentes du dossier technique de l'installation.",
    sections: [
      { icon: '🏊', title: 'Données', text: 'Pour chaque bassin : désignation, dimensions, surfaces, volumes, débit réglementaire et débit réel.' },
      { icon: '🔄', title: 'Débit de recyclage', text: 'Le débit réglementaire = Volume / Temps de recyclage. Le débit réel doit être ≥ au débit réglementaire.' },
    ],
  },
  etablissement: {
    title: 'Fiche établissement',
    intro: "Informations administratives — page de garde du carnet sanitaire.",
    sections: [
      { icon: '🏢', title: 'Informations obligatoires', text: 'Nom, adresse et téléphone sont obligatoires. Ils apparaissent sur la page de garde officielle.' },
      { icon: '👤', title: "Capacité d'accueil", text: 'Capacité maximale de baigneurs et visiteurs, couvert et plein air. Définis lors de la déclaration à l\'ARS.' },
      { icon: '🏛️', title: 'Visa ARS', text: "Le tampon officiel apposé par l'ARS lors de la validation du carnet sanitaire." },
    ],
  },
  contacts: {
    title: 'Contacts importants',
    intro: 'Annuaire des organismes à contacter en urgence ou en cas de besoin.',
    sections: [
      { icon: '🚨', title: 'Urgences', text: 'SAMU (15), Pompiers (18), Police (17) doivent être connus de tout le personnel.' },
      { icon: '🏛️', title: 'ARS', text: "En cas de problème grave de qualité d'eau, vous devez informer l'ARS dans les 24h." },
      { icon: '📞', title: 'Mise à jour', text: 'Vérifiez ces informations au moins une fois par an ou à chaque changement de responsable.' },
    ],
  },
}

export default function HelpPanel({ pageId }: { pageId: string }) {
  const [open, setOpen] = useState(false)
  const help = helpContent[pageId]
  if (!help) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Aide & explications"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1.5px solid var(--accent)',
          background: 'white', color: 'var(--accent)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, flexShrink: 0,
          transition: 'all 0.15s',
          boxShadow: '0 1px 4px rgba(0,174,239,0.15)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--accent)'; }}
      >?</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,80,120,0.18)', backdropFilter: 'blur(2px)' }} />
          <div style={{
            position: 'relative', zIndex: 1,
            width: 380, height: '100%', maxHeight: '100vh',
            background: '#fff', boxShadow: '-4px 0 32px rgba(0,174,239,0.12)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            borderLeft: '3px solid var(--accent)',
          }}>
            <div style={{ background: 'var(--accent)', padding: '20px 24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>💡</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{help.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Guide d'utilisation</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>{help.intro}</p>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {help.sections.map((s, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>{s.text}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 'auto', background: 'var(--surface2)' }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                📖 Arrêté du 26 mai 2021 (NOR:SSAP2004757A)<br />
                Applicable au 1er janvier 2022 — Art. D.1332-1 et D.1332-10 CSP
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
