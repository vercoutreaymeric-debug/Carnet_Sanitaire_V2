'use client'

export default function PrintActions() {
  return (
    <div style={{ background: '#f1f5f9', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
      <span style={{ fontSize: 13, color: '#64748b', fontFamily: 'Arial' }}>Prévisualisation PDF</span>
      <button
        onClick={() => window.print()}
        style={{ marginLeft: 'auto', background: '#00aeef', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Arial' }}
      >
        🖨️ Imprimer / Enregistrer PDF
      </button>
      <button
        onClick={() => window.history.back()}
        style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'Arial' }}
      >
        ✕ Fermer
      </button>
    </div>
  )
}
