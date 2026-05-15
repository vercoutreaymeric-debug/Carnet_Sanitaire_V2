'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Btn from '@/components/Btn'
import Input from '@/components/Input'
import HelpPanel from '@/components/HelpPanel'
import type { Etablissement } from '@/types'

interface Props { initialData: Etablissement }

export default function EtablissementClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const upd = (k: keyof Etablissement, v: string | number) => setData(d => ({ ...d, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/etablissement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Fiche établissement</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Informations générales et conformité réglementaire</p>
        </div>
        <HelpPanel pageId="etablissement" />
      </div>

      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--text2)' }}>Identification</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input
            label="Nom de l'établissement"
            value={data.nom}
            onChange={e => upd('nom', e.target.value)}
            style={{ gridColumn: 'span 2' }}
            required
          />
          <Input
            label="Adresse"
            value={data.adresse}
            onChange={e => upd('adresse', e.target.value)}
            style={{ gridColumn: 'span 2' }}
          />
          <Input
            label="Téléphone"
            value={data.telephone}
            onChange={e => upd('telephone', e.target.value)}
            type="tel"
          />
        </div>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--text2)' }}>Capacité d'accueil</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <Input label="Baigneurs (couvert)" value={data.capaciteBaigneursCouvert} onChange={e => upd('capaciteBaigneursCouvert', parseInt(e.target.value) || 0)} type="number" unit="pers." />
          <Input label="Visiteurs (couvert)" value={data.capaciteVisiteursCouvert} onChange={e => upd('capaciteVisiteursCouvert', parseInt(e.target.value) || 0)} type="number" unit="pers." />
          <Input label="Baigneurs (plein air)" value={data.capaciteBaigneursPleinAir} onChange={e => upd('capaciteBaigneursPleinAir', parseInt(e.target.value) || 0)} type="number" unit="pers." />
          <Input label="Visiteurs (plein air)" value={data.capaciteVisiteursPleinAir} onChange={e => upd('capaciteVisiteursPleinAir', parseInt(e.target.value) || 0)} type="number" unit="pers." />
        </div>
      </Card>

      <Card style={{ border: '1px dashed var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: 14 }}>Visa de l'ARS</h3>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Joindre le document de visa officiel (fonctionnalité à venir)</p>
          </div>
          <Btn variant="ghost" small icon="upload">Importer document</Btn>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn icon="save" onClick={handleSave} disabled={saving || !data.nom}>
          {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Btn>
        {data.updatedAt && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            Dernière modification : {new Date(data.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text3)' }}>
        Conforme à l'arrêté du 26 mai 2021 (NOR:SSAP2004757A) — Articles D.1332-1 et D.1332-10 du Code de la Santé Publique
      </p>
    </div>
  )
}
