'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabImagenes({ modelos, familias }: { modelos: any[]; familias: any[] }) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [imgs, setImgs] = useState<Record<string, string>>({})
  const sb = createClient()

  async function upload(bucket: string, id: string, file: File) {
    setUploading(id)
    const ext = file.name.split('.').pop()
    const path = `${id}.${ext}`
    const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true })
    if (!error) {
      const { data } = sb.storage.from(bucket).getPublicUrl(path)
      const url = data.publicUrl
      if (bucket === 'model-images') {
        await sb.from('modelos').update({ imagen_url: url }).eq('id', id)
      } else {
        await sb.from('familias').update({ imagen_url: url }).eq('id', id)
      }
      setImgs(p => ({ ...p, [id]: url }))
    }
    setUploading(null)
  }

  const ImgCard = ({ item, bucket }: { item: any; bucket: string }) => {
    const ref = useRef<HTMLInputElement>(null)
    const url = imgs[item.id] ?? item.imagen_url
    return (
      <div style={{ background: '#f4f6fa', border: '1px solid #dde3f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ height: 90, background: 'linear-gradient(135deg,#dde3f0,#c0ccee)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {url ? <img src={url} alt={item.nombre ?? item.codigo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🏗️</span>}
        </div>
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: '.78rem', fontWeight: 600, marginBottom: 6 }}>{item.nombre ?? item.codigo}</div>
          <button onClick={() => ref.current?.click()} disabled={uploading === item.id}
            style={{ background: '#003087', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: '.75rem', cursor: 'pointer', width: '100%' }}>
            {uploading === item.id ? 'Subiendo…' : '📷 Cambiar'}
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(bucket, item.id, f) }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 4 }}>Imágenes de Modelos</h3>
        <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 16 }}>JPG, PNG o WebP · Recomendado: 800×600px</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
          {modelos.map(m => <ImgCard key={m.id} item={m} bucket="model-images" />)}
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 4 }}>Imágenes de Familias</h3>
        <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 16 }}>Aparecen en las tarjetas de la página principal.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
          {familias.map(f => <ImgCard key={f.id} item={{ ...f, codigo: f.slug }} bucket="family-images" />)}
        </div>
      </div>
    </div>
  )
}
