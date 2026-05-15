'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import Card from '@/components/Card'
import Icon from '@/components/Icon'

type Range = 'jour' | 'semaine' | 'mois' | 'annee'

interface Props {
  releves: Array<{ date: string; heure?: string; ph: number; chloreLibre: number; status: string; bassinNom: string }>
  frequentations: Array<{ date: string; total: number }>
  interventions: Array<{ date: string; type: string }>
}

// ── Utilitaires date ──────────────────────────────────────────────────────────
function isoToday() { return new Date().toISOString().slice(0, 10) }

function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function addMonths(date: string, n: number) {
  const d = new Date(date + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

function startOfWeek(date: string) {
  const d = new Date(date + 'T12:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)) // lundi
  return d.toISOString().slice(0, 10)
}

function daysInMonth(date: string) {
  const [y, m] = date.slice(0, 7).split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function avg(arr: number[]) {
  if (!arr.length) return null
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const RANGE_BTN: { key: Range; label: string }[] = [
  { key: 'jour',    label: 'Jour' },
  { key: 'semaine', label: 'Semaine' },
  { key: 'mois',   label: 'Mois' },
  { key: 'annee',  label: 'Année' },
]

const tooltipStyle = {
  background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12,
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function StatistiquesClient({ releves, frequentations, interventions }: Props) {

  const years = useMemo(() => {
    const all = [...releves.map(r => r.date.slice(0, 4)), ...frequentations.map(f => f.date.slice(0, 4))]
    return Array.from(new Set(all)).sort().reverse()
  }, [releves, frequentations])

  const [range, setRange]               = useState<Range>('mois')
  const [selectedDate, setSelectedDate] = useState(isoToday())
  const [year, setYear]                 = useState(years[0] ?? new Date().getFullYear().toString())

  // ── Navigation ‹ › ──────────────────────────────────────────────────────────
  function navigate(dir: -1 | 1) {
    if (range === 'jour')    setSelectedDate(d => addDays(d, dir))
    if (range === 'semaine') setSelectedDate(d => addDays(d, dir * 7))
    if (range === 'mois')    setSelectedDate(d => addMonths(d, dir))
  }

  function rangeLabel() {
    if (range === 'annee') return year
    if (range === 'mois') {
      const [y, m] = selectedDate.slice(0, 7).split('-')
      return `${MONTH_LABELS[parseInt(m) - 1]} ${y}`
    }
    if (range === 'semaine') {
      const s = startOfWeek(selectedDate)
      const e = addDays(s, 6)
      return `${s.slice(8)}/${s.slice(5, 7)} – ${e.slice(8)}/${e.slice(5, 7)}`
    }
    return selectedDate
  }

  // ── Données des graphiques ───────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // ── Année ──
    if (range === 'annee') {
      return Array.from({ length: 12 }, (_, i) => {
        const mk = `${year}-${String(i + 1).padStart(2, '0')}`
        const mr = releves.filter(r => r.date.slice(0, 7) === mk)
        const mf = frequentations.filter(f => f.date.slice(0, 7) === mk)
        const mi = interventions.filter(v => v.date.slice(0, 7) === mk)
        const conf = mr.filter(r => r.status === 'conforme').length
        return {
          label: MONTH_LABELS[i],
          ph: avg(mr.map(r => r.ph)),
          chlore: avg(mr.map(r => r.chloreLibre)),
          baigneurs: mf.reduce((s, f) => s + f.total, 0) || null,
          interventions: mi.length || null,
          conformite: mr.length ? Math.round(conf / mr.length * 100) : null,
          nbReleves: mr.length,
          bassin: null as string | null,
        }
      })
    }

    // ── Mois ──
    if (range === 'mois') {
      const monthStr = selectedDate.slice(0, 7)
      const days = daysInMonth(selectedDate)
      return Array.from({ length: days }, (_, i) => {
        const day = String(i + 1).padStart(2, '0')
        const dateStr = `${monthStr}-${day}`
        const dr = releves.filter(r => r.date === dateStr)
        const df = frequentations.filter(f => f.date === dateStr)
        const di = interventions.filter(v => v.date === dateStr)
        const conf = dr.filter(r => r.status === 'conforme').length
        return {
          label: String(i + 1),
          ph: avg(dr.map(r => r.ph)),
          chlore: avg(dr.map(r => r.chloreLibre)),
          baigneurs: df.reduce((s, f) => s + f.total, 0) || null,
          interventions: di.length || null,
          conformite: dr.length ? Math.round(conf / dr.length * 100) : null,
          nbReleves: dr.length,
          bassin: null as string | null,
        }
      })
    }

    // ── Semaine ──
    if (range === 'semaine') {
      const weekStart = startOfWeek(selectedDate)
      return Array.from({ length: 7 }, (_, i) => {
        const dateStr = addDays(weekStart, i)
        const dr = releves.filter(r => r.date === dateStr)
        const df = frequentations.filter(f => f.date === dateStr)
        const di = interventions.filter(v => v.date === dateStr)
        const conf = dr.filter(r => r.status === 'conforme').length
        const d = new Date(dateStr + 'T12:00:00')
        return {
          label: DAY_LABELS[d.getDay()],
          ph: avg(dr.map(r => r.ph)),
          chlore: avg(dr.map(r => r.chloreLibre)),
          baigneurs: df.reduce((s, f) => s + f.total, 0) || null,
          interventions: di.length || null,
          conformite: dr.length ? Math.round(conf / dr.length * 100) : null,
          nbReleves: dr.length,
          bassin: null as string | null,
        }
      })
    }

    // ── Jour — chaque relevé individuellement ──
    const dayReleves = releves
      .filter(r => r.date === selectedDate)
      .sort((a, b) => (a.heure ?? '').localeCompare(b.heure ?? ''))
    return dayReleves.map((r, i) => ({
      label: r.heure ?? `#${i + 1}`,
      ph: r.ph,
      chlore: r.chloreLibre,
      baigneurs: null as number | null,
      interventions: null as number | null,
      conformite: r.status === 'conforme' ? 100 : r.status === 'attention' ? 50 : 0,
      nbReleves: 1,
      bassin: r.bassinNom,
    }))
  }, [range, selectedDate, year, releves, frequentations, interventions])

  // ── KPIs filtrés ─────────────────────────────────────────────────────────────
  const filtReleves = useMemo(() => {
    if (range === 'annee') return releves.filter(r => r.date.startsWith(year))
    if (range === 'mois')  return releves.filter(r => r.date.startsWith(selectedDate.slice(0, 7)))
    if (range === 'semaine') {
      const s = startOfWeek(selectedDate); const e = addDays(s, 6)
      return releves.filter(r => r.date >= s && r.date <= e)
    }
    return releves.filter(r => r.date === selectedDate)
  }, [range, selectedDate, year, releves])

  const filtFreq = useMemo(() => {
    if (range === 'annee') return frequentations.filter(f => f.date.startsWith(year))
    if (range === 'mois')  return frequentations.filter(f => f.date.startsWith(selectedDate.slice(0, 7)))
    if (range === 'semaine') {
      const s = startOfWeek(selectedDate); const e = addDays(s, 6)
      return frequentations.filter(f => f.date >= s && f.date <= e)
    }
    return frequentations.filter(f => f.date === selectedDate)
  }, [range, selectedDate, year, frequentations])

  const filtInter = useMemo(() => {
    if (range === 'annee') return interventions.filter(i => i.date.startsWith(year))
    if (range === 'mois')  return interventions.filter(i => i.date.startsWith(selectedDate.slice(0, 7)))
    if (range === 'semaine') {
      const s = startOfWeek(selectedDate); const e = addDays(s, 6)
      return interventions.filter(i => i.date >= s && i.date <= e)
    }
    return interventions.filter(i => i.date === selectedDate)
  }, [range, selectedDate, year, interventions])

  const tauxConf = filtReleves.length
    ? Math.round(filtReleves.filter(r => r.status === 'conforme').length / filtReleves.length * 100) : 0
  const phMoy    = avg(filtReleves.map(r => r.ph))
  const chloreMoy = avg(filtReleves.map(r => r.chloreLibre))

  const kpis = [
    { label: 'pH moyen',         value: phMoy !== null ? String(phMoy) : '—',                     color: 'var(--accent)' },
    { label: 'Chlore libre moy.', value: chloreMoy !== null ? `${chloreMoy} mg/L` : '—',           color: 'var(--green)' },
    { label: 'Conformité',        value: filtReleves.length ? `${tauxConf}%` : '—',                color: tauxConf >= 90 ? 'var(--green)' : tauxConf >= 70 ? 'var(--orange)' : 'var(--red)' },
    { label: 'Baigneurs',         value: filtFreq.reduce((s, f) => s + f.total, 0).toLocaleString(), color: 'var(--text2)' },
    { label: 'Interventions',     value: String(filtInter.length),                                  color: 'var(--orange)' },
  ]

  const chartTitle = rangeLabel()
  const canDrillDown = range !== 'jour'

  // ── Drill-down : clic sur un point/barre → zoom dans la période ──────────────
  function handleChartClick(data: Record<string, unknown>) {
    if (!data?.activeLabel) return
    const label = data.activeLabel as string

    if (range === 'annee') {
      const monthIdx = MONTH_LABELS.indexOf(label)
      if (monthIdx === -1) return
      setSelectedDate(`${year}-${String(monthIdx + 1).padStart(2, '0')}-01`)
      setRange('mois')
    } else if (range === 'mois') {
      const day = parseInt(label)
      if (isNaN(day)) return
      setSelectedDate(`${selectedDate.slice(0, 7)}-${String(day).padStart(2, '0')}`)
      setRange('jour')
    } else if (range === 'semaine') {
      const WEEK_ORDER = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      const offset = WEEK_ORDER.indexOf(label)
      if (offset === -1) return
      setSelectedDate(addDays(startOfWeek(selectedDate), offset))
      setRange('jour')
    }
  }

  async function exportExcel() {
    const res = await fetch(`/api/export/excel?year=${year}`)
    if (!res.ok) { alert('Erreur export'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `statistiques-${year}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Styles communs ───────────────────────────────────────────────────────────
  const navBtnStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '7px 14px', cursor: 'pointer', color: 'var(--text)',
    fontFamily: 'DM Sans', fontSize: 16, fontWeight: 700,
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8,
    padding: '7px 10px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Statistiques</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Analyse de la qualité de l'eau</p>
        </div>
        <button onClick={exportExcel}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <Icon name="download" size={15} /> Export Excel
        </button>
      </div>

      {/* Sélecteur de plage */}
      <Card style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          {/* Bouton retour (drill-up) */}
          {range !== 'annee' && (
            <button
              onClick={() => {
                if (range === 'jour')    setRange('semaine')
                if (range === 'semaine') setRange('mois')
                if (range === 'mois')   setRange('annee')
              }}
              title="Zoom arrière"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: 'var(--accent)', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← Retour
            </button>
          )}

          {/* Toggle Jour / Semaine / Mois / Année */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)', gap: 2 }}>
            {RANGE_BTN.map(({ key, label }) => (
              <button key={key} onClick={() => setRange(key)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: range === key ? 'var(--accent)' : 'transparent',
                color: range === key ? '#fff' : 'var(--text2)',
                fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, transition: 'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Sélecteur année */}
          {range === 'annee' ? (
            <select value={year} onChange={e => setYear(e.target.value)} style={inputStyle}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          ) : (
            /* Navigation ‹ date › */
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => navigate(-1)} style={navBtnStyle}>‹</button>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={inputStyle} />
              <button onClick={() => navigate(1)} style={navBtnStyle}>›</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', minWidth: 120 }}>{rangeLabel()}</span>
            </div>
          )}
        </div>
      </Card>

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{k.label}</span>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 500, color: k.color }}>{k.value}</span>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        {/* pH */}
        <Card style={canDrillDown ? { cursor: 'pointer' } : {}}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="water" size={14} color="var(--accent)" /> pH — {chartTitle}
          </h3>
          {canDrillDown && <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 12 }}>↓ Cliquez pour zoomer</p>}
          {!canDrillDown && <div style={{ marginBottom: 12 }} />}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <YAxis domain={[6.5, 8.5]} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={7.1} stroke="var(--green)" strokeDasharray="4 2" label={{ value: '7.1', fontSize: 9, fill: 'var(--green)', position: 'insideTopRight' }} />
              <ReferenceLine y={7.6} stroke="var(--green)" strokeDasharray="4 2" label={{ value: '7.6', fontSize: 9, fill: 'var(--green)', position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="ph" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="pH" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Chlore */}
        <Card style={canDrillDown ? { cursor: 'pointer' } : {}}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="water" size={14} color="var(--green)" /> Chlore libre — {chartTitle}
          </h3>
          {canDrillDown && <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 12 }}>↓ Cliquez pour zoomer</p>}
          {!canDrillDown && <div style={{ marginBottom: 12 }} />}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <YAxis domain={[0, 3]} tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} mg/L`]} />
              <ReferenceLine y={0.4} stroke="var(--green)" strokeDasharray="4 2" label={{ value: '0.4', fontSize: 9, fill: 'var(--green)', position: 'insideTopRight' }} />
              <ReferenceLine y={1.4} stroke="var(--green)" strokeDasharray="4 2" label={{ value: '1.4', fontSize: 9, fill: 'var(--green)', position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="chlore" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cl libre" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Baigneurs */}
        <Card style={canDrillDown ? { cursor: 'pointer' } : {}}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="people" size={14} color="var(--text2)" /> Baigneurs — {chartTitle}
          </h3>
          {canDrillDown && <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 12 }}>↓ Cliquez pour zoomer</p>}
          {!canDrillDown && <div style={{ marginBottom: 12 }} />}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="baigneurs" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Baigneurs" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Conformité */}
        <Card style={canDrillDown ? { cursor: 'pointer' } : {}}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={14} color="var(--green)" /> Conformité — {chartTitle}
          </h3>
          {canDrillDown && <p style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 12 }}>↓ Cliquez pour zoomer</p>}
          {!canDrillDown && <div style={{ marginBottom: 12 }} />}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text3)' }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v}%`]} />
              <ReferenceLine y={100} stroke="var(--green)" strokeDasharray="4 2" />
              <Bar dataKey="conformite" radius={[4, 4, 0, 0]} name="Conformité" fill="var(--green)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tableau récapitulatif */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Récapitulatif — {chartTitle}
          {filtReleves.length === 0 && (
            <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>Aucune donnée pour cette période</span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Période', 'Relevés', 'pH moyen', 'Cl libre moy.', 'Conformité', 'Baigneurs', 'Interventions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.filter(row => row.nbReleves > 0 || (row.baigneurs ?? 0) > 0).map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>
                    {row.label}
                    {row.bassin && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>— {row.bassin}</span>}
                  </td>
                  <td style={{ fontFamily: 'DM Mono' }}>{row.nbReleves || '—'}</td>
                  <td style={{ fontFamily: 'DM Mono', color: row.ph && row.ph >= 7.1 && row.ph <= 7.6 ? 'var(--green)' : row.ph ? 'var(--orange)' : 'var(--text3)' }}>
                    {row.ph ?? '—'}
                  </td>
                  <td style={{ fontFamily: 'DM Mono', color: row.chlore && row.chlore >= 0.4 && row.chlore <= 1.4 ? 'var(--green)' : row.chlore ? 'var(--red)' : 'var(--text3)' }}>
                    {row.chlore ? `${row.chlore} mg/L` : '—'}
                  </td>
                  <td>
                    {row.conformite !== null
                      ? <span style={{ fontWeight: 700, color: row.conformite >= 90 ? 'var(--green)' : row.conformite >= 70 ? 'var(--orange)' : 'var(--red)' }}>{row.conformite}%</span>
                      : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ fontFamily: 'DM Mono' }}>{row.baigneurs?.toLocaleString() ?? '—'}</td>
                  <td style={{ fontFamily: 'DM Mono', color: (row.interventions ?? 0) > 0 ? 'var(--orange)' : 'var(--text3)' }}>
                    {row.interventions ?? '—'}
                  </td>
                </tr>
              ))}
              {chartData.filter(row => row.nbReleves > 0 || (row.baigneurs ?? 0) > 0).length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
