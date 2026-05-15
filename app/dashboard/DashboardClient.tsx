'use client'
import React, { useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import Metric from '@/components/Metric'
import Icon from '@/components/Icon'
import { formatDateFR } from '@/lib/utils'
import type { Releve, Intervention } from '@/types'

const norms = [
  { label: 'pH',           range: '7.1 – 7.6' },
  { label: 'Chlore libre', range: '0.4 – 1.4 mg/L' },
  { label: 'Chlore combiné', range: '< 0.6 mg/L' },
  { label: 'Température',  range: '≤ 30°C (couvert)' },
  { label: 'TAC',          range: '≥ 9°F' },
  { label: 'TH',           range: '≥ 10°F' },
]

interface Props {
  releves: Releve[]
  interventions: Intervention[]
  baigneursAujourdhui: number
  interventionsCeMois: number
  today: string
  relevesToday: number
  relevesAValider: number
}

type ChartRange = 'jour' | 'semaine' | 'mois'

function avg(arr: number[]) {
  if (!arr.length) return null
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100
}

export default function DashboardClient({ releves, interventions, baigneursAujourdhui, interventionsCeMois, today, relevesToday, relevesAValider }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoring, setRestoring] = React.useState(false)
  const [chartRange, setChartRange] = useState<ChartRange>('semaine')

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm(`Restaurer la sauvegarde "${file.name}" ?\n\nToutes les données actuelles seront remplacées.`)) {
      e.target.value = ''
      return
    }
    setRestoring(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`✅ Restauration réussie !\n${data.restored.releves} relevés, ${data.restored.bassins} bassins, ${data.restored.interventions} interventions.`)
      router.refresh()
    } catch (err) {
      alert(`❌ Erreur : ${err}`)
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }
  const lastReleves = releves.slice(0, 2)
  const nonConformes = releves.filter(r => r.status === 'nonconforme').length
  const attention = releves.filter(r => r.status === 'attention').length
  const conformes = releves.filter(r => r.status === 'conforme').length

  // Données graphique selon la plage choisie
  const chartData = useMemo(() => {
    if (chartRange === 'jour') {
      // Chaque relevé du jour, par heure
      return releves
        .filter(r => r.date === today)
        .sort((a, b) => (a.heure ?? '').localeCompare(b.heure ?? ''))
        .map((r, i) => ({
          label: r.heure ?? `#${i + 1}`,
          ph: r.ph,
          chlore: r.chloreLibre,
        }))
    }
    if (chartRange === 'semaine') {
      // 7 derniers jours — moyenne par jour
      const days = Array.from(new Set(releves.map(r => r.date))).sort().slice(-7)
      return days.map(date => {
        const dr = releves.filter(r => r.date === date)
        return { label: date.slice(5).replace('-', '/'), ph: avg(dr.map(r => r.ph)), chlore: avg(dr.map(r => r.chloreLibre)) }
      })
    }
    // mois — 30 derniers jours — moyenne par jour
    const days = Array.from(new Set(releves.map(r => r.date))).sort().slice(-30)
    return days.map(date => {
      const dr = releves.filter(r => r.date === date)
      return { label: date.slice(5).replace('-', '/'), ph: avg(dr.map(r => r.ph)), chlore: avg(dr.map(r => r.chloreLibre)) }
    })
  }, [chartRange, releves, today])

  const chartRangeLabel = chartRange === 'jour' ? "Aujourd'hui" : chartRange === 'semaine' ? '7 derniers jours' : '30 derniers jours'

  const kpis = [
    { label: "Baigneurs aujourd'hui", value: baigneursAujourdhui, icon: 'people' as const, color: 'var(--accent)' },
    { label: 'Relevés conformes', value: `${conformes}/${releves.length}`, icon: 'water' as const, color: 'var(--green)' },
    { label: 'Alertes en attente', value: attention + nonConformes, icon: 'alert' as const, color: nonConformes > 0 ? 'var(--red)' : attention > 0 ? 'var(--orange)' : 'var(--green)' },
    { label: 'Interventions ce mois', value: interventionsCeMois, icon: 'wrench' as const, color: 'var(--text2)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Tableau de bord</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar" size={13} />
            {formatDateFR(today)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Restaurer */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleRestore}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 16px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: restoring ? 'not-allowed' : 'pointer', opacity: restoring ? 0.7 : 1 }}
            title="Restaurer une sauvegarde JSON"
          >
            <Icon name="upload" size={15} /> {restoring ? 'Restauration…' : 'Restaurer'}
          </button>
          {/* Sauvegarder */}
          <button
            onClick={() => window.open('/api/backup', '_blank')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 16px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            title="Télécharger une sauvegarde complète des données"
          >
            <Icon name="download" size={15} /> Sauvegarde
          </button>
          <button
            onClick={() => router.push('/releves')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            <Icon name="plus" size={16} /> Nouveau relevé
          </button>
        </div>
      </div>

      {/* Alerte relevé manquant */}
      {relevesToday === 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="alert" size={18} color="var(--orange)" />
          <span style={{ color: 'var(--orange)', fontWeight: 600 }}>Aucun relevé saisi aujourd'hui</span>
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>— Le relevé journalier est obligatoire (Arrêté 26/05/2021)</span>
          <button onClick={() => router.push('/releves')} style={{ marginLeft: 'auto', background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', whiteSpace: 'nowrap' }}>
            Saisir maintenant →
          </button>
        </div>
      )}

      {/* Alerte relevés à valider */}
      {relevesAValider > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <span style={{ color: '#854d0e', fontWeight: 600 }}>{relevesAValider} relevé(s) en attente de validation</span>
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>— Cliquez pour valider</span>
          <button onClick={() => router.push('/releves')} style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', whiteSpace: 'nowrap' }}>
            Valider maintenant →
          </button>
        </div>
      )}

      {/* Alert non-conformité */}
      {nonConformes > 0 && (
        <div style={{ background: 'var(--red)18', border: '1px solid var(--red)44', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="alert" size={18} color="var(--red)" />
          <span style={{ color: 'var(--red)', fontWeight: 600 }}>{nonConformes} relevé(s) non conforme(s) aujourd'hui</span>
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>— Vérification requise avant ouverture</span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>{kpi.label}</span>
              <div style={{ background: kpi.color + '22', borderRadius: 8, padding: 6 }}>
                <Icon name={kpi.icon} size={15} color={kpi.color} />
              </div>
            </div>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 500, color: kpi.color }}>{kpi.value}</span>
          </Card>
        ))}
      </div>

      {/* Derniers relevés + interventions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Relevés */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15 }}>Derniers relevés</h3>
            <button onClick={() => router.push('/releves')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans' }}>Voir tout →</button>
          </div>
          {lastReleves.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Aucun relevé</Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lastReleves.map(r => (
                <Card key={r.id} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{r.bassinNom}</span>
                      <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>{r.heure}</span>
                    </div>
                    <Badge status={r.status} small />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <Metric label="pH" value={r.ph} status={r.ph >= 7.1 && r.ph <= 7.6 ? 'ok' : r.ph <= 7.8 ? 'warn' : 'bad'} />
                    <Metric label="Cl libre" value={r.chloreLibre} unit="mg/L" status={r.chloreLibre >= 0.4 && r.chloreLibre <= 1.4 ? 'ok' : 'bad'} />
                    <Metric label="T° eau" value={r.tempEau} unit="°C" status="ok" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Interventions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, fontSize: 15 }}>Dernières interventions</h3>
            <button onClick={() => router.push('/interventions')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans' }}>Voir tout →</button>
          </div>
          {interventions.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>Aucune intervention</Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {interventions.slice(0, 3).map(iv => {
                const typeColor = iv.type === 'Incident' ? 'var(--orange)' : 'var(--accent)'
                return (
                  <Card key={iv.id} style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{iv.date}{iv.heure ? ` · ${iv.heure}` : ''}</span>
                      <span style={{ fontSize: 11, background: typeColor + '22', color: typeColor, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{iv.type}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{iv.bassin}</p>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{iv.description}</p>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Graphiques */}
      {releves.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Toggle plage */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Plage :</span>
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)', gap: 2 }}>
              {([
                { key: 'jour',    label: 'Jour' },
                { key: 'semaine', label: 'Semaine' },
                { key: 'mois',   label: 'Mois' },
              ] as { key: ChartRange; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setChartRange(key)} style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: chartRange === key ? 'var(--accent)' : 'transparent',
                  color: chartRange === key ? '#fff' : 'var(--text2)',
                  fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{chartData.length} point(s)</span>
          </div>

          {/* Charts */}
          {chartData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="water" size={14} color="var(--accent)" /> pH — {chartRangeLabel}
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                    <YAxis domain={[6.5, 8.5]} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
                    <ReferenceLine y={7.1} stroke="var(--green)" strokeDasharray="4 2" label={{ value: 'min 7.1', fontSize: 9, fill: 'var(--green)' }} />
                    <ReferenceLine y={7.6} stroke="var(--green)" strokeDasharray="4 2" label={{ value: 'max 7.6', fontSize: 9, fill: 'var(--green)' }} />
                    <Line type="monotone" dataKey="ph" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="pH" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="water" size={14} color="var(--green)" /> Chlore libre — {chartRangeLabel}
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                    <YAxis domain={[0, 3]} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`${v} mg/L`, 'Cl libre']} />
                    <ReferenceLine y={0.4} stroke="var(--green)" strokeDasharray="4 2" label={{ value: 'min 0.4', fontSize: 9, fill: 'var(--green)' }} />
                    <ReferenceLine y={1.4} stroke="var(--green)" strokeDasharray="4 2" label={{ value: 'max 1.4', fontSize: 9, fill: 'var(--green)' }} />
                    <Line type="monotone" dataKey="chlore" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Cl libre" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          ) : (
            <Card style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
              Aucun relevé pour cette période
            </Card>
          )}
        </div>
      )}

      {/* Valeurs réglementaires */}
      <Card style={{ background: 'var(--surface2)' }}>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="info" size={14} color="var(--accent)" /> Valeurs limites réglementaires (Arrêté 26/05/2021)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {norms.map((n, i) => (
            <div key={i} style={{ background: 'var(--surface3)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{n.label}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--text)' }}>{n.range}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
