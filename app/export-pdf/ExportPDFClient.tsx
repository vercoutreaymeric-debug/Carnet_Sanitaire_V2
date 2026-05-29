'use client'
import { useState } from 'react'
import Card from '@/components/Card'
import { todayISO } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(d: string) {
  if (!d) return ''
  const [y, m, j] = d.split('-')
  return `${j}/${m}/${y}`
}
function statusLabel(s: string) {
  if (s === 'conforme')    return 'Conforme'
  if (s === 'attention')   return 'Attention'
  if (s === 'nonconforme') return 'Non conforme'
  return s
}
function firstDay(year: string, month: string) {
  return `${year}-${month}-01`
}
function lastDay(year: string, month: string) {
  return new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10)
}

const BLEU = '#0e4f6e'
const VERT = '#16a34a'
const ORANGE = '#d97706'
const ROUGE = '#dc2626'
const GRIS = '#6b7280'

type Periode = 'mois' | 'trimestre' | 'annee' | 'perso'
type Section = 'releves' | 'traitements' | 'frequentation' | 'interventions' | 'bassins' | 'audit'

export default function ExportPDFClient() {
  const now = new Date()
  const yearStr = String(now.getFullYear())
  const monthStr = String(now.getMonth() + 1).padStart(2, '0')

  const [periode, setPeriode] = useState<Periode>('mois')
  const [year, setYear]       = useState(yearStr)
  const [month, setMonth]     = useState(monthStr)
  const [duPerso, setDuPerso] = useState(firstDay(yearStr, monthStr))
  const [auPerso, setAuPerso] = useState(todayISO())
  const [sections, setSections] = useState<Section[]>(['releves', 'traitements', 'frequentation', 'interventions', 'bassins', 'audit'])
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<null | { nb: Record<string, number>; etablissement: string; du: string; au: string }>(null)

  function toggleSection(s: Section) {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function getDates(): { du: string; au: string } {
    if (periode === 'perso') return { du: duPerso, au: auPerso }
    if (periode === 'mois')  return { du: firstDay(year, month), au: lastDay(year, month) }
    if (periode === 'annee') return { du: `${year}-01-01`, au: `${year}-12-31` }
    // trimestre
    const q = Math.floor((parseInt(month) - 1) / 3)
    const startM = String(q * 3 + 1).padStart(2, '0')
    const endM   = String(q * 3 + 3).padStart(2, '0')
    return { du: firstDay(year, startM), au: lastDay(year, endM) }
  }

  async function handleGenerate() {
    setLoading(true)
    setPreview(null)
    const { du, au } = getDates()

    const res = await fetch(`/api/export/pdf?du=${du}&au=${au}`)
    if (!res.ok) { setLoading(false); alert('Erreur lors de la récupération des données'); return }
    const data = await res.json()

    // Génération dynamique jsPDF (SSR-safe)
    const { default: jsPDF }     = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14

    // ── PAGE DE COUVERTURE ───────────────────────────────────────────────────
    // Bandeau bleu en-tête
    doc.setFillColor(14, 79, 110)
    doc.rect(0, 0, W, 42, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('CARNET SANITAIRE NUMÉRIQUE', W / 2, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Arrêté du 26 mai 2021 — NOR:SSAP2004757A', W / 2, 28, { align: 'center' })
    doc.text('Code de la santé publique — Art. D1332-10', W / 2, 35, { align: 'center' })

    // Bloc établissement
    doc.setTextColor(14, 79, 110)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const nomEtab = data.etablissement?.nom || 'Établissement'
    doc.text(nomEtab, W / 2, 62, { align: 'center' })

    // Infos établissement complètes
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const etabLines = [
      data.etablissement?.adresse,
      data.etablissement?.telephone ? `Tél. : ${data.etablissement.telephone}` : null,
    ].filter(Boolean)
    etabLines.forEach((line, i) => doc.text(line as string, W / 2, 70 + i * 6, { align: 'center' }))

    // Capacités
    const capCouvert   = data.etablissement?.capaciteBaigneursCouvert   || 0
    const capPleinAir  = data.etablissement?.capaciteBaigneursPleinAir  || 0
    if (capCouvert || capPleinAir) {
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      const capText = [
        capCouvert  ? `Capacité couverte : ${capCouvert} baigneurs` : null,
        capPleinAir ? `Capacité plein air : ${capPleinAir} baigneurs` : null,
      ].filter(Boolean).join('  •  ')
      doc.text(capText, W / 2, 70 + etabLines.length * 6 + 4, { align: 'center' })
    }

    // Période
    doc.setDrawColor(14, 79, 110)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, 80, W - margin * 2, 24, 3, 3, 'S')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(14, 79, 110)
    doc.text('PÉRIODE', W / 2, 89, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 30)
    doc.text(`du ${fmt(du)} au ${fmt(au)}`, W / 2, 98, { align: 'center' })

    // Récapitulatif des données
    const stats = [
      { label: 'Relevés qualité', count: data.releves.length,       color: [0, 174, 239] },
      { label: 'Traitements',     count: data.traitements.length,   color: [22, 163, 74] },
      { label: 'Fréquentation',   count: data.frequentations.length, color: [245, 158, 11] },
      { label: 'Interventions',   count: data.interventions.length, color: [220, 38, 38] },
    ]

    let sx = margin
    const bw = (W - margin * 2 - 9) / 4
    stats.forEach((s, i) => {
      const x = sx + i * (bw + 3)
      doc.setFillColor(s.color[0], s.color[1], s.color[2])
      doc.roundedRect(x, 112, bw, 22, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(String(s.count), x + bw / 2, 121, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(s.label, x + bw / 2, 128, { align: 'center' })
    })

    // Conformité des relevés
    const conformes    = data.releves.filter((r: any) => r.status === 'conforme').length
    const attention    = data.releves.filter((r: any) => r.status === 'attention').length
    const nonConformes = data.releves.filter((r: any) => r.status === 'nonconforme').length
    const valides      = data.releves.filter((r: any) => r.valide).length

    doc.setTextColor(14, 79, 110)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('CONFORMITÉ DES RELEVÉS', margin, 148)

    doc.setFillColor(240, 253, 244)
    doc.roundedRect(margin, 152, 42, 14, 2, 2, 'F')
    doc.setTextColor(22, 163, 74)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(`${conformes} conformes`, margin + 21, 161, { align: 'center' })

    doc.setFillColor(255, 251, 235)
    doc.roundedRect(margin + 45, 152, 42, 14, 2, 2, 'F')
    doc.setTextColor(217, 119, 6)
    doc.text(`${attention} attention`, margin + 66, 161, { align: 'center' })

    doc.setFillColor(254, 242, 242)
    doc.roundedRect(margin + 90, 152, 42, 14, 2, 2, 'F')
    doc.setTextColor(220, 38, 38)
    doc.text(`${nonConformes} non conformes`, margin + 111, 161, { align: 'center' })

    doc.setFillColor(239, 246, 255)
    doc.roundedRect(margin + 135, 152, 42, 14, 2, 2, 'F')
    doc.setTextColor(37, 99, 235)
    doc.text(`${valides} signés`, margin + 156, 161, { align: 'center' })

    // Bas de page couverture
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150, 150, 150)
    doc.text(`Généré le ${fmt(todayISO())} — Carnet Sanitaire Numérique CIFEC`, W / 2, pageH - 10, { align: 'center' })

    // ── Pied de page sur toutes les pages suivantes ──────────────────────────
    function addFooter(pageNum: number, total: number) {
      const p = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'italic')
      doc.line(margin, p - 13, W - margin, p - 13)
      doc.text(`${nomEtab} — Carnet Sanitaire Numérique CIFEC`, margin, p - 8)
      doc.text(`Page ${pageNum} / ${total}`, W - margin, p - 8, { align: 'right' })
    }

    const commonHead: any = { fillColor: [14, 79, 110], textColor: 255, fontStyle: 'bold', fontSize: 8 }
    const bodyStyle: any = { fontSize: 8, textColor: [30, 30, 30] }
    const tableOpts = { margin: { left: margin, right: margin }, headStyles: commonHead, bodyStyles: bodyStyle, alternateRowStyles: { fillColor: [248, 250, 252] }, tableLineColor: [220, 220, 220], tableLineWidth: 0.1 }

    // ── SECTION RELEVÉS ──────────────────────────────────────────────────────
    if (sections.includes('releves') && data.releves.length) {
      doc.addPage()
      doc.setFillColor(14, 79, 110)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('RELEVÉS QUALITÉ EAU', margin, 11)

      autoTable(doc, {
        startY: 20,
        head: [['Date', 'Heure', 'Bassin', 'Point', 'pH', 'Cl libre', 'Cl comb.', 'T° eau', 'Statut', 'Signé par']],
        body: data.releves.map((r: any) => [
          fmt(r.date),
          r.heure || '',
          r.bassinNom,
          r.pointPrelevement || '',
          r.ph,
          `${r.chloreLibre} mg/L`,
          r.chloreCombine != null ? `${r.chloreCombine} mg/L` : '',
          `${r.tempEau}°C`,
          statusLabel(r.status),
          r.valideePar || '',
        ]),
        columnStyles: {
          8: { textColor: (row: any) => {
            const v = row.raw
            if (v === 'Conforme') return [22, 163, 74]
            if (v === 'Attention') return [217, 119, 6]
            return [220, 38, 38]
          }},
        },
        didParseCell: (data: any) => {
          if (data.column.index === 8 && data.section === 'body') {
            const v = data.cell.text[0]
            if (v === 'Conforme')    data.cell.styles.textColor = [22, 163, 74]
            if (v === 'Attention')   data.cell.styles.textColor = [217, 119, 6]
            if (v === 'Non conforme') data.cell.styles.textColor = [220, 38, 38]
          }
        },
        ...tableOpts,
      })
    }

    // ── SECTION TRAITEMENTS ──────────────────────────────────────────────────
    if (sections.includes('traitements') && data.traitements.length) {
      doc.addPage()
      doc.setFillColor(22, 101, 52)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('TRAITEMENTS', margin, 11)

      autoTable(doc, {
        startY: 20,
        head: [['Date', 'Bassin', 'Désinfectant', 'Correcteur pH', 'Stabilisant', 'Notes']],
        body: data.traitements.map((t: any) => [
          fmt(t.date),
          t.bassinNom,
          t.quantiteDesinfectant != null ? `${t.quantiteDesinfectant} ${t.uniteDesinfectant || ''}` : '',
          t.quantiteCorrecteurPh != null ? `${t.quantiteCorrecteurPh} ${t.uniteCorrecteurPh || ''}` : '',
          t.quantiteStabilisant  != null ? `${t.quantiteStabilisant}  ${t.uniteStabilisant  || ''}` : '',
          t.notes || '',
        ]),
        headStyles: { ...commonHead, fillColor: [22, 101, 52] },
        ...tableOpts,
      })
    }

    // ── SECTION FRÉQUENTATION & COMPTEURS EAU ───────────────────────────────
    if (sections.includes('frequentation') && data.frequentations.length) {
      doc.addPage()
      doc.setFillColor(180, 83, 9)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('FRÉQUENTATION & COMPTEURS EAU', margin, 11)

      const totalBaigneurs = data.frequentations.reduce((a: number, f: any) => a + (f.total || 0), 0)
      const totalEau = data.frequentations.reduce((a: number, f: any) => a + (f.totalEau || 0), 0)

      doc.setTextColor(180, 83, 9)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total période : ${totalBaigneurs} baigneurs — ${totalEau.toFixed(1)} m³ d'eau consommés`, margin, 19.5)

      autoTable(doc, {
        startY: 23,
        head: [['Date', 'Scolaire', 'Club', 'Public', 'Autre', 'Total', 'Report (m³)', 'Relevé (m³)', 'Conso (m³)', 'L/baigneur']],
        body: data.frequentations.map((f: any) => [
          fmt(f.date),
          f.scolaire || 0,
          f.club || 0,
          f.publicCount || 0,
          f.autre || 0,
          f.total || 0,
          f.reportEau != null ? f.reportEau : '',
          f.releveEau != null ? f.releveEau : '',
          f.totalEau  != null ? f.totalEau  : '',
          f.litresParBaigneur != null ? f.litresParBaigneur : '',
        ]),
        headStyles: { ...commonHead, fillColor: [180, 83, 9] },
        ...tableOpts,
      })
    }

    // ── SECTION INTERVENTIONS ─────────────────────────────────────────────────
    if (sections.includes('interventions') && data.interventions.length) {
      doc.addPage()
      doc.setFillColor(127, 29, 29)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('INTERVENTIONS & MAINTENANCE', margin, 11)

      autoTable(doc, {
        startY: 20,
        head: [['Date', 'Heure', 'Type', 'Bassin', 'Description', 'Agent', 'Statut']],
        body: data.interventions.map((i: any) => [
          fmt(i.date),
          i.heure || '',
          i.type,
          i.bassin,
          i.description,
          i.agent || '',
          i.status,
        ]),
        headStyles: { ...commonHead, fillColor: [127, 29, 29] },
        columnStyles: { 4: { cellWidth: 55 } },
        ...tableOpts,
      })
    }

    // ── SECTION DOSSIER TECHNIQUE BASSINS ────────────────────────────────────
    if (sections.includes('bassins') && data.bassins.length) {
      doc.addPage()
      doc.setFillColor(30, 58, 138)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DOSSIER TECHNIQUE DES BASSINS', margin, 11)

      autoTable(doc, {
        startY: 20,
        head: [['Bassin', 'Type', 'Classif.', 'Volume (m³)', 'Débit régl.', 'Débit inst.', 'Traitement', 'Mesure']],
        body: data.bassins.map((b: any) => [
          b.nom,
          b.type === 'couvert' ? 'Couvert' : b.type === 'plein_air' ? 'Plein air' : b.type,
          b.typeReglementaire ? `Type ${b.typeReglementaire}` : '',
          b.volumeTotal != null ? `${b.volumeTotal} m³` : '',
          b.debitReglementaire != null ? `${b.debitReglementaire} m³/h` : '',
          b.debitInstallation  != null ? `${b.debitInstallation} m³/h`  : '',
          b.traitementPrincipal || '',
          b.typeMesure === 'analyseur' ? 'Analyseur (régl.)' : b.typeMesure === 'ponctuelle' ? 'Ponctuelle' : '',
        ]),
        headStyles: { ...commonHead, fillColor: [30, 58, 138] },
        ...tableOpts,
      })

      // Dimensions détaillées par bassin
      let startY = (doc as any).lastAutoTable.finalY + 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 58, 138)
      doc.text('Dimensions détaillées', margin, startY)
      startY += 4

      autoTable(doc, {
        startY,
        head: [['Bassin', 'Longueur', 'Largeur', 'Prof. min', 'Prof. max', 'Surf. sup.', 'Surf. inf.', 'Minéralisation']],
        body: data.bassins.map((b: any) => [
          b.nom,
          b.longueur != null ? `${b.longueur} m` : '',
          b.largeur  != null ? `${b.largeur} m`  : '',
          b.profMin  != null ? `${b.profMin} m`  : '',
          b.profMax  != null ? `${b.profMax} m`  : '',
          b.surfSuperieure != null ? `${b.surfSuperieure} m²` : '',
          b.surfInferieure != null ? `${b.surfInferieure} m²` : '',
          b.mineralisationEau || '',
        ]),
        headStyles: { ...commonHead, fillColor: [30, 58, 138] },
        ...tableOpts,
      })
    }

    // ── SECTION JOURNAL D'AUDIT (traçabilité des modifications) ──────────────
    if (sections.includes('audit') && data.auditLogs.length) {
      doc.addPage()
      doc.setFillColor(55, 48, 107)
      doc.rect(0, 0, W, 16, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('JOURNAL D\'AUDIT — TRAÇABILITÉ DES MODIFICATIONS', margin, 11)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(55, 48, 107)
      doc.text('Conforme à l\'exigence de traçabilité des modifications du carnet sanitaire numérique', margin, 19)

      autoTable(doc, {
        startY: 23,
        head: [['Date & heure', 'Action', 'Module', 'Utilisateur', 'Détail']],
        body: data.auditLogs.map((l: any) => [
          new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          l.action,
          l.module,
          l.user || '',
          l.detail || '',
        ]),
        headStyles: { ...commonHead, fillColor: [55, 48, 107] },
        columnStyles: { 4: { cellWidth: 70 } },
        ...tableOpts,
      })
    }

    // ── Numéros de page ───────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i, totalPages)
    }

    // ── Téléchargement ────────────────────────────────────────────────────────
    const fileName = `carnet-sanitaire_${du}_${au}.pdf`
    doc.save(fileName)

    setPreview({
      nb: {
        releves:       data.releves.length,
        traitements:   data.traitements.length,
        frequentation: data.frequentations.length,
        interventions: data.interventions.length,
      },
      etablissement: data.etablissement?.nom || '',
      du, au,
    })
    setLoading(false)
  }

  const { du, au } = getDates()

  const sectionConfig = [
    { key: 'releves'      as Section, label: 'Relevés qualité eau',           color: '#00aeef' },
    { key: 'traitements'  as Section, label: 'Traitements',                    color: '#16a34a' },
    { key: 'frequentation'as Section, label: 'Fréquentation + compteurs eau',  color: '#d97706' },
    { key: 'interventions'as Section, label: 'Interventions / maintenance',    color: '#dc2626' },
    { key: 'bassins'      as Section, label: 'Dossier technique des bassins',  color: '#1e3a8a' },
    { key: 'audit'        as Section, label: "Journal d'audit (traçabilité)",  color: '#37306b' },
  ]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0e4f6e', margin: 0 }}>
          Export PDF — Carnet Sanitaire
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          Génère un rapport officiel conforme à l'arrêté du 26 mai 2021, prêt pour un contrôle ARS.
        </p>
      </div>

      {/* Choix de la période */}
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0e4f6e', marginBottom: 14 }}>Période</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {([['mois', 'Mois'], ['trimestre', 'Trimestre'], ['annee', 'Année'], ['perso', 'Personnalisé']] as [Periode, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setPeriode(k)} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none',
              background: periode === k ? '#0e4f6e' : '#f1f5f9',
              color: periode === k ? '#fff' : '#374151',
              transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>

        {periode !== 'perso' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(periode === 'mois' || periode === 'trimestre') && (
              <div>
                <label style={labelStyle}>Mois</label>
                <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                    <option key={m} value={m}>{['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][i]}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Année</label>
              <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                {['2022','2023','2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}

        {periode === 'perso' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <label style={labelStyle}>Du</label>
              <input type="date" value={duPerso} onChange={e => setDuPerso(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Au</label>
              <input type="date" value={auPerso} onChange={e => setAuPerso(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280', background: '#f8fafc', borderRadius: 6, padding: '6px 10px', display: 'inline-block' }}>
          Période sélectionnée : <strong>{fmt(du)}</strong> → <strong>{fmt(au)}</strong>
        </div>
      </Card>

      {/* Sections à inclure */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0e4f6e', marginBottom: 14 }}>Sections à inclure</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sectionConfig.map(s => (
            <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${sections.includes(s.key) ? s.color : '#e5e7eb'}`, background: sections.includes(s.key) ? `${s.color}10` : '#fafafa', transition: 'all 0.15s' }}>
              <input type="checkbox" checked={sections.includes(s.key)} onChange={() => toggleSection(s.key)}
                style={{ width: 16, height: 16, accentColor: s.color, cursor: 'pointer' }} />
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{s.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Bouton générer */}
      <button
        onClick={handleGenerate}
        disabled={loading || sections.length === 0}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 700,
          background: (loading || sections.length === 0) ? '#94a3b8' : 'linear-gradient(135deg, #00c4ff, #0099d6)',
          color: '#fff', border: 'none', cursor: (loading || sections.length === 0) ? 'not-allowed' : 'pointer',
          boxShadow: (loading || sections.length === 0) ? 'none' : '0 4px 18px #00aeef44',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {loading ? 'Génération du PDF…' : 'Télécharger le PDF officiel'}
      </button>

      {/* Confirmation après génération */}
      {preview && (
        <div style={{ marginTop: 20, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', marginBottom: 10 }}>
            ✅ PDF généré et téléchargé !
          </div>
          <div style={{ fontSize: 13, color: '#166534', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Établissement : <strong>{preview.etablissement}</strong></span>
            <span>Période : <strong>{fmt(preview.du)} → {fmt(preview.au)}</strong></span>
            <span>{preview.nb.releves} relevés · {preview.nb.traitements} traitements · {preview.nb.frequentation} jours de fréquentation · {preview.nb.interventions} interventions</span>
          </div>
        </div>
      )}

      {/* Mention réglementaire */}
      <div style={{ marginTop: 24, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#1e40af' }}>
        <strong>Conformité réglementaire</strong><br />
        Ce PDF inclut toutes les données requises par l'arrêté du 26 mai 2021 et l'article D1332-10 du Code de la santé publique. Il peut être présenté lors d'un contrôle de l'ARS. La conservation minimale obligatoire est de 3 ans (année en cours + 2 années précédentes).
      </div>
    </div>
  )
}

// ── Styles inline réutilisables ───────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5,
}
const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
  fontSize: 13, color: '#1f2937', background: '#fff', cursor: 'pointer', outline: 'none',
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
  fontSize: 13, color: '#1f2937', outline: 'none',
}
