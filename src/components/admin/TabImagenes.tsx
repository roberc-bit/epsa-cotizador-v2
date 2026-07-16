'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabImagenes({ modelos, familias }: { modelos: any[]; familias: any[] }) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [imgs, setImgs] = useState<Record<string, string>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [savingName, setSavingName] = useState<string | null>(null)
  const [savedName, setSavedName] = useState<Record<string, boolean>>({})
  const sb = createClient()

  async function upload(bucket: string, id: string, file: File) {
    setUploading(id)
    const ext = file.name.split('.').pop()
    const path = `${id}.${ext}`
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true })
    if (!error) {
      const { data } = sb.storage.from(bucket).getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      if (bucket === 'model-images') {
        await sb.from('modelos').update({ imagen_url: url }).eq('id', id)
      } else {
        await sb.from('familias').update({ imagen_url: url }).eq('id', id)
      }
      setImgs(p => ({ ...p, [id]: url }))
    }
    setUploading(null)
  }

  async function saveName(table: 'modelos' | 'familias', id: string, field: 'nombre' | 'codigo') {
    const val = names[`${table}-${id}`]
    if (!val?.trim()) return
    setSavingName(id)
    await sb.from(table).update({ [field]: val.trim() }).eq('id', id)
    setSavingName(null)
    setSavedName(p => ({ ...p, [id]: true }))
    setTimeout(() => setSavedName(p => ({ ...p, [id]: false })), 2000)
  }

  const ImgCard = ({ item, bucket, table, nameField }: { item: any; bucket: string; table: 'modelos' | 'familias'; nameField: 'nombre' | 'codigo' }) => {
    const ref = useRef<HTMLInputElement>(null)
    const url = imgs[item.id] ?? item.imagen_url
    const nameKey = `${table}-${item.id}`
    const displayName = item.nombre ?? item.codigo
    const subName = table === 'modelos' ? item.codigo : null

    return (
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Image */}
        <div style={{ height: 100, background: 'linear-gradient(135deg,#dde3f0,#c0ccee)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {url
            ? <img src={url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2rem' }}>🏗️</span>}
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading === item.id}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(0,48,135,.85)', color: '#fff', border: 'none',
              padding: '3px 10px', borderRadius: 6, fontSize: '.7rem', cursor: 'pointer',
              backdropFilter: 'blur(2px)'
            }}
          >
            {uploading === item.id ? '…' : '📷'}
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(bucket, item.id, f) }} />
        </div>
        {/* Name edit */}
        <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {subName && <div style={{ fontSize: '.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>{subName}</div>}
          <input
            type="text"
            defaultValue={displayName}
            placeholder="Nombre..."
            onChange={e => setNames(p => ({ ...p, [nameKey]: e.target.value }))}
            style={{ width: '100%', border: '1px solid #dde3f0', borderRadius: 6, padding: '5px 8px', fontSize: '.8rem', boxSizing: 'border-box' as const }}
          />
          <button
            type="button"
            onClick={() => saveName(table, item.id, nameField === 'codigo' ? 'nombre' : 'nombre')}
            disabled={savingName === item.id || !names[nameKey]}
            style={{
              background: savedName[item.id] ? '#16a34a' : '#003087',
              color: '#fff', border: 'none', padding: '5px 0', borderRadius: 6,
              fontSize: '.75rem', cursor: 'pointer', fontWeight: 600, width: '100%',
              opacity: names[nameKey] ? 1 : 0.4
            }}
          >
            {savingName === item.id ? '…' : savedName[item.id] ? '✓ Guardado' : 'Guardar nombre'}
          </button>
        </div>
      </div>
    )
  }

  const Section = ({ title, subtitle, items, bucket, table, nameField }: any) => (
    <div style={{ background: '#f4f6fa', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 4 }}>{title}</h3>
      <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 16 }}>{subtitle}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {items.map((m: any) => (
          <ImgCard key={m.id} item={m} bucket={bucket} table={table} nameField={nameField} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section
        title="Imágenes y nombres de modelos"
        subtitle="Hacé clic en 📷 para cambiar la imagen. Editá el nombre y guardá."
        items={modelos}
        bucket="model-images"
        table="modelos"
        nameField="nombre"
      />
      <Section
        title="Imágenes y nombres de familias"
        subtitle="Aparecen en las tarjetas de la página principal."
        items={familias}
        bucket="family-images"
        table="familias"
        nameField="nombre"
      />
    </div>
  )
}
