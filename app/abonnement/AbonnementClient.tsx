'use client'
import Card from '@/components/Card'
import Icon from '@/components/Icon'

interface Abonnement {
  plan: string
  statut: string
  dateDebut: Date | string
  dateExpiration: Date | string
  maxBassins: number
  maxUtilisateurs: number
  notes: string
  updatedAt: Date | string
}

interface Props {
  abonnement: Abonnement
  bassinsCount: number
  usersCount: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  actif:     { label: 'Actif',     color: '#10b981', bg: '#10b98118', icon: '✅' },
  essai:     { label: 'Essai',     color: '#f59e0b', bg: '#f59e0b18', icon: '🕐' },
  suspendu:  { label: 'Suspendu', color: '#f97316', bg: '#f9731618', icon: '⏸️' },
  expiré:    { label: 'Expiré',   color: '#ef4444', bg: '#ef444418', icon: '❌' },
}

const PLAN_CONFIG: Record<string, { color: string; features: string[] }> = {
  Starter:    { color: '#6b7280', features: ['Jusqu\'à 5 bassins', 'Jusqu\'à 10 utilisateurs', 'Relevés journaliers', 'Exports PDF'] },
  Pro:        { color: '#00aeef', features: ['Jusqu\'à 15 bassins', 'Jusqu\'à 30 utilisateurs', 'Statistiques avancées', 'Historique complet', 'Notifications email'] },
  Intégral:   { color: '#9333ea', features: ['Bassins illimités', 'Utilisateurs illimités', 'Toutes fonctionnalités', 'Support prioritaire', 'Multi-établissements'] },
  'Sur-mesure':{ color: '#ec4899', features: ['Fonctionnalités personnalisées', 'Support dédié', 'Formation incluse'] },
}

function jours(d1: Date | string, d2: Date | string) {
  return Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000)
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const illimite = max >= 999
  if (illimite) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
          <span>{value} utilisés</span>
          <span style={{ fontWeight: 700, color, fontSize: 16 }}>∞</span>
        </div>
        <div style={{ height: 8, background: `${color}30`, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${color}66, ${color})`, borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Illimité</div>
      </div>
    )
  }
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const danger = pct >= 90
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
        <span>{value} utilisés</span>
        <span style={{ fontWeight: 600, color: danger ? '#ef4444' : 'var(--text)' }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: danger ? '#ef4444' : color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>sur {max} inclus</div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AbonnementClient({ abonnement, bassinsCount, usersCount }: Props) {
  const statut = STATUT_CONFIG[abonnement.statut] ?? STATUT_CONFIG['expiré']
  const planCfg = PLAN_CONFIG[abonnement.plan] ?? { color: '#6b7280', features: [] }

  const totalJours = jours(abonnement.dateDebut, abonnement.dateExpiration)
  const joursRestants = jours(new Date(), abonnement.dateExpiration)
  const pctTemps = totalJours <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((joursRestants / totalJours) * 100)))
  const estExpire = joursRestants <= 0
  const alerteExpiration = joursRestants <= 30 && !estExpire

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Mon abonnement</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>État de votre licence Carnet Sanitaire CIFEC</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 14, fontWeight: 700, padding: '8px 18px', borderRadius: 10,
          background: statut.bg, color: statut.color, border: `1.5px solid ${statut.color}44`,
        }}>
          {statut.icon} {statut.label}
        </span>
      </div>

      {/* Alerte expiration imminente */}
      {alerteExpiration && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, color: '#c2410c', fontSize: 14 }}>Expiration dans {joursRestants} jour{joursRestants > 1 ? 's' : ''}</p>
            <p style={{ fontSize: 13, color: '#9a3412', marginTop: 2 }}>
              Votre abonnement expire le {fmt(abonnement.dateExpiration)}. Contactez CIFEC pour le renouveler.
            </p>
          </div>
        </div>
      )}

      {/* Alerte expiré */}
      {estExpire && abonnement.statut !== 'essai' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p style={{ fontWeight: 600, color: '#991b1b', fontSize: 14 }}>Abonnement expiré</p>
            <p style={{ fontSize: 13, color: '#7f1d1d', marginTop: 2 }}>
              Votre accès est limité. Contactez CIFEC au <strong>+33 1 XX XX XX XX</strong> ou à <strong>contact@cifec.fr</strong> pour renouveler.
            </p>
          </div>
        </div>
      )}

      {/* Plan + durée */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Plan */}
        <Card style={{ border: `2px solid ${planCfg.color}44`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: planCfg.color, borderRadius: '12px 12px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingTop: 4 }}>
            <div style={{ background: `${planCfg.color}22`, borderRadius: 10, padding: 10 }}>
              <Icon name="creditCard" size={22} color={planCfg.color} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Plan</p>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: planCfg.color }}>{abonnement.plan}</h3>
            </div>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 0, listStyle: 'none' }}>
            {planCfg.features.map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                <span style={{ color: planCfg.color, flexShrink: 0 }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Durée / expiration */}
        <Card>
          <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 16 }}>
            Durée de l'abonnement
          </p>

          {/* Gros compteur jours restants */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <p style={{ fontSize: 48, fontFamily: 'DM Mono', fontWeight: 700, color: estExpire ? '#ef4444' : alerteExpiration ? '#f59e0b' : 'var(--accent)', lineHeight: 1 }}>
              {estExpire ? '0' : joursRestants}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
              {estExpire ? 'abonnement expiré' : `jour${joursRestants > 1 ? 's' : ''} restant${joursRestants > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Barre de progression temporelle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{
                height: '100%', borderRadius: 99, transition: 'width 0.6s ease',
                width: `${pctTemps}%`,
                background: estExpire ? '#ef4444' : alerteExpiration
                  ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                  : 'linear-gradient(90deg, var(--accent), #10b981)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
              <span>Début : {fmt(abonnement.dateDebut)}</span>
              <span>Fin : {fmt(abonnement.dateExpiration)}</span>
            </div>
          </div>

          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>
            Durée totale : <strong style={{ color: 'var(--text)' }}>{totalJours} jours</strong>
          </div>
        </Card>
      </div>

      {/* Consommation ressources */}
      <Card>
        <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 18 }}>
          Utilisation des ressources
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="pool" size={15} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Bassins</span>
            </div>
            <ProgressBar value={bassinsCount} max={abonnement.maxBassins} color="var(--accent)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="people" size={15} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Utilisateurs</span>
            </div>
            <ProgressBar value={usersCount} max={abonnement.maxUtilisateurs} color="#10b981" />
          </div>
        </div>
      </Card>

      {/* Contact CIFEC */}
      <Card style={{ background: 'linear-gradient(135deg, var(--accent)0a, #9333ea08)', border: '1px solid var(--accent)22' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--accent)18', borderRadius: 10, padding: 10, flexShrink: 0 }}>
            <Icon name="phone" size={20} color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Besoin d'aide ou renouvellement ?</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Contactez l'équipe CIFEC pour toute question sur votre abonnement, une évolution de plan ou un renouvellement.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <a href="mailto:contact@cifec.fr" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                📧 contact@cifec.fr
              </a>
              <a href="tel:+33XXXXXXXXX" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                📞 Appelez-nous
              </a>
            </div>
          </div>
        </div>
      </Card>

      <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
        Dernière mise à jour : {fmt(abonnement.updatedAt)}
      </p>
    </div>
  )
}
