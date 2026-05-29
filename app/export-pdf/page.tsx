import { Suspense } from 'react'
import ExportPDFClient from './ExportPDFClient'

export default function ExportPDFPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#666' }}>Chargement…</div>}>
      <ExportPDFClient />
    </Suspense>
  )
}
