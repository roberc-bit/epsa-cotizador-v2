'use client'
import { useState, useRef } from 'react'

export default function TabPrecios({ modelos, familias }: { modelos: any[]; familias: any[] }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [modelSheet, setModelSheet] = useState('')
  const [familiaId, setFamiliaId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const modelFileRef = useRef<HTMLInputElement>(null)

  async function uploadPrices(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/prices/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setResult(data.error ?? `✓ ${data.updated} modelos actualizados`)
    setUploading(false)
  }

  async function uploadModel() {
    if (!modelFile) return
    setUploading(true); setResult(null)
    const fd = new FormData()
    fd.append('file', modelFile)
    fd.append('sheet', modelSheet)
    fd.append('familia_id', familiaId)
    const res = await fetch('/api/models/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setResult(data.error ?? `✓ Modelo cargado: ${data.codigo} (${data.items} ítems)`)
    setUploading(false)
    setModelFile(null); setModelSheet(''); setFamiliaId('')
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24, marginBottom: 20 }}>{children}</div>
  )
  const H3 = ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>{children}</h3>
  )
  const UploadZone = ({ onClick, icon, title, hint }: any) => (
    <div onClick={onClick} style={{ border: '2px dashed #dde3f0', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: '#f4f6fa' }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <p style={{ fontSize: '.85rem', color: '#6b7280', marginTop: 8 }}><strong>{title}</strong></p>
      <p style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 4 }}>{hint}</p>
    </div>
  )

  return (
    <>
      <Card>
        <H3>Actualizar Lista de Precios</H3>
        <p style={{ fontSize: '.85rem', color: '#6b7280', marginBottom: 16 }}>Subí <strong>precio de lista.xlsx</strong> para actualizar los precios base de todos los modelos. Columnas: MODELO, DESCRIPCIÓN, PRECIO FOB, PRECIO LISTA.</p>
        <UploadZone onClick={() => fileRef.current?.click()} icon="📊" title="Seleccionar precio de lista.xlsx" hint="Se procesarán automáticamente todos los modelos encontrados" />
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={uploadPrices} />
      </Card>

      <Card>
        <H3>Cargar / Actualizar Modelo</H3>
        <p style={{ fontSize: '.85rem', color: '#6b7280', marginBottom: 16 }}>Subí el Excel de especificaciones de un modelo (A25.xlsx, EC230.xlsx, etc.) para cargar todos sus ítems automáticamente.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', display: 'block', marginBottom: 6 }}>Familia</label>
            <select value={familiaId} onChange={e => setFamiliaId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }}>
              <option value="">Seleccionar familia…</option>
              {familias.map((f: any) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', display: 'block', marginBottom: 6 }}>Nombre hoja Excel (opcional)</label>
            <input value={modelSheet} onChange={e => setModelSheet(e.target.value)} placeholder="Ej: 775958_EC230FL3"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }} />
          </div>
        </div>
        <UploadZone onClick={() => modelFileRef.current?.click()} icon="📋" title="Seleccionar Excel del modelo" hint="Los ítems de serie, configurables, desplegables y opcionales se procesan automáticamente" />
        <input ref={modelFileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={e => setModelFile(e.target.files?.[0] ?? null)} />
        {modelFile && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '.85rem', color: '#6b7280' }}>📄 {modelFile.name}</span>
            <button onClick={uploadModel} disabled={uploading || !familiaId}
              style={{ background: '#003087', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: !familiaId ? .5 : 1 }}>
              {uploading ? 'Procesando…' : '⬆️ Procesar modelo'}
            </button>
          </div>
        )}
      </Card>

      {result && (
        <div style={{ background: result.startsWith('✓') ? '#e8f5e9' : '#fce4e4', color: result.startsWith('✓') ? '#2e7d32' : '#c62828', padding: '12px 16px', borderRadius: 8, fontWeight: 600 }}>
          {result}
        </div>
      )}
    </>
  )
}
