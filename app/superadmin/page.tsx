import { prisma } from '@/lib/prisma'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import NotifyButton from './NotifyButton'
import RecalculButton from './RecalculButton'
import CredentialsForm from './CredentialsForm'
import AbonnementForm from './AbonnementForm'
export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const [userCount, releveCount, bassinCount, interventionCount, logs, superadminUser, abonnement] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.releve.count().catch(() => 0),
    prisma.bassin.count().catch(() => 0),
    prisma.intervention.count().catch(() => 0),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
    prisma.user.findFirst({ where: { role: 'superadmin' }, select: { username: true } }).catch(() => null),
    prisma.abonnement.findUnique({ where: { id: 1 } }).catch(() => null),
  ])
  const etab = await prisma.etablissement.findUnique({ where: { id: 1 } }).catch(() => null)

  const stats = [
    { label: 'Utilisateurs', value: userCount,       icon: 'people',  color: '#9333ea' },
    { label: 'Relevés',      value: releveCount,      icon: 'water',   color: '#00aeef' },
    { label: 'Bassins',      value: bassinCount,      icon: 'pool',    color: '#10b981' },
    { label: 'Interventions',value: interventionCount, icon: 'wrench', color: '#f97316' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #9333ea22, #7c3aed11)', border: '1px solid #9333ea44', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="settings" size={20} color="#9333ea" />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#9333ea' }}>CIFEC — Super Admin</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Accès support technique — Vue globale de l'installation</p>
        </div>
      </div>

      {/* Établissement */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="building" size={14} color="var(--accent)" /> Établissement client
        </h3>
        {etab ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Nom',       value: etab.nom },
              { label: 'Adresse',   value: etab.adresse   || '—' },
              { label: 'Téléphone', value: etab.telephone || '—' },
            ].map(f => (
              <div key={f.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{f.label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{f.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Aucun établissement configuré</p>
        )}
      </Card>

      {/* Stats */}
      <div className="kpi-grid">
        {stats.map((s, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</span>
              <Icon name={s.icon as 'people'} size={15} color={s.color} />
            </div>
            <span style={{ fontFamily: 'DM Mono', fontSize: 32, fontWeight: 500, color: s.color }}>{s.value}</span>
          </Card>
        ))}
      </div>

      {/* Abonnement client */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          💳 Abonnement du client
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Définissez le plan, les dates et les limites de l'abonnement. L'établissement voit ces informations en lecture seule dans l'onglet <strong>Abonnement</strong>.
        </p>
        <AbonnementForm current={abonnement} />
      </Card>

      {/* Identifiants superadmin */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔑 Mes identifiants de connexion
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Modifiez votre identifiant et/ou mot de passe superadmin. Le mot de passe actuel est toujours requis pour confirmer.
        </p>
        <CredentialsForm currentUsername={superadminUser?.username ?? 'superadmin'} />
      </Card>

      {/* Recalcul statuts */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔄 Recalcul des statuts de conformité
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Recalcule le statut (conforme / attention / non conforme) de tous les relevés existants
          avec les seuils réglementaires à jour (Arrêté du 7 avril 1981 modifié).
          À utiliser après une mise à jour des règles de conformité.
        </p>
        <RecalculButton />
      </Card>

      {/* Notifications */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔔 Notifications email
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Envoie un email d'alerte à tous les utilisateurs si aucun relevé n'a été saisi aujourd'hui.
          En production, configurez un cron job qui appelle <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>/api/notify?secret=VOTRE_SECRET</code> chaque matin.
        </p>
        <NotifyButton />
      </Card>

      {/* Dernières actions */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Dernières actions (audit)
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Action</th><th>Module</th><th>Détail</th></tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--text2)' }}>
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                    background: log.action === 'CREATE' ? 'var(--green)22'
                      : log.action === 'DELETE'  ? 'var(--red)22'
                      : log.action === 'NOTIFY'  ? '#f59e0b22'
                      : 'var(--accent)22',
                    color: log.action === 'CREATE' ? 'var(--green)'
                      : log.action === 'DELETE'  ? 'var(--red)'
                      : log.action === 'NOTIFY'  ? '#f59e0b'
                      : 'var(--accent)',
                  }}>{log.action}</span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text2)' }}>{log.module}</td>
                <td style={{ fontSize: 13 }}>{log.detail}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Aucune action</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
