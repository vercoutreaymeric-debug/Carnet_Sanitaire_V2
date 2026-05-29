import { prisma } from '@/lib/prisma'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import CredentialsForm from './CredentialsForm'
import EtablissementsManager from './EtablissementsManager'
export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const [totalUsers, totalReleves, totalBassins, superadminUser, etablissements] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.releve.count().catch(() => 0),
    prisma.bassin.count().catch(() => 0),
    prisma.user.findFirst({ where: { role: 'superadmin' }, select: { username: true } }).catch(() => null),
    prisma.etablissement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        abonnement: true,
        _count: { select: { users: true, bassins: true, releves: true } },
      },
    }).catch(() => []),
  ])

  const stats = [
    { label: 'Établissements', value: etablissements.length, icon: 'building' as const, color: '#9333ea' },
    { label: 'Utilisateurs',   value: totalUsers,            icon: 'people'   as const, color: '#00aeef' },
    { label: 'Bassins total',  value: totalBassins,          icon: 'pool'     as const, color: '#10b981' },
    { label: 'Relevés total',  value: totalReleves,          icon: 'water'    as const, color: '#f97316' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #9333ea22, #7c3aed11)', border: '1px solid #9333ea44', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="settings" size={20} color="#9333ea" />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#9333ea' }}>CIFEC — Super Admin</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Gestion multi-établissements — Vue globale</p>
        </div>
      </div>

      {/* Stats globales */}
      <div className="kpi-grid">
        {stats.map((s, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</span>
              <Icon name={s.icon} size={15} color={s.color} />
            </div>
            <span style={{ fontFamily: 'DM Mono', fontSize: 32, fontWeight: 500, color: s.color }}>{s.value}</span>
          </Card>
        ))}
      </div>

      {/* Gestionnaire établissements */}
      <EtablissementsManager etablissements={etablissements} />

      {/* Identifiants superadmin */}
      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          🔑 Mes identifiants de connexion
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Modifiez votre identifiant et/ou mot de passe superadmin.
        </p>
        <CredentialsForm currentUsername={superadminUser?.username ?? 'superadmin'} />
      </Card>

    </div>
  )
}
