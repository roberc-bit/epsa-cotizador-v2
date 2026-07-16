'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabEmpresa({ empresa }: { empresa: any }) {
  const [form, setForm] = useState({ ...empresa })
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoStatus, setLogoStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const logoRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

  // Check existing logo on mount
  useState(() => {
    fetch('/api/config').then(r => r.json()).then(d => {
      if (d.logo_url) setLogoUrl(d.logo_url)
    }).catch(() => {})
  })

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    setLogoStatus('idle')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `logo.${ext}`
    const { error } = await sb.storage.from('logos').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = sb.storage.from('logos').getPublicUrl(path)
      setLogoUrl(data.publicUrl + '?t=' + Date.now())
      setLogoStatus('ok')
    } else {
      setLogoStatus('error')
      console.error('Logo upload error:', error.message)
    }
    setLogoUploading(false)
  }

  async function removeLogo() {
    const extensions = ['svg', 'png', 'jpg', 'jpeg', 'webp']
    for (const ext of extensions) {
      await sb.storage.from('logos').remove([`logo.${ext}`]).catch(() => {})
    }
    setLogoUrl(null)
    setLogoStatus('idle')
  }

  async function save() {
    setSaving(true)
    await sb.from('empresa').update({
      nombre: form.nombre, validez: form.validez,
      tipo_cambio: parseFloat(form.tipo_cambio),
      email: form.email, telefono: form.telefono,
      pie_cotizacion: form.pie_cotizacion,
    }).eq('id', 1)
    setSaving(false); setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  const F = (label: string, key: string, type = 'text') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: .4, color: '#6b7280' }}>{label}</label>
      <input type={type} value={form[key] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
        style={{ padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Logo */}
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 4, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>
          Logo de la empresa
        </h3>
        <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 16 }}>
          Reemplaza el texto "ESCANDINAVIA DEL PLATA" en el encabezado. PNG con fondo transparente o SVG recomendado.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Preview on header background */}
          <div style={{
            width: 240, height: 64, background: '#003087', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', padding: '8px 16px', flexShrink: 0
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: 200, objectFit: 'contain' }} />
              : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontSize: '.8rem', fontWeight: 700 }}>ESCANDINAVIA DEL PLATA</div>
                  <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '.65rem' }}>Volvo Construction Equipment</div>
                </div>
              )
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
              style={{ background: '#003087', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}>
              {logoUploading ? 'Subiendo…' : '📷 Subir logo'}
            </button>
            {logoUrl && (
              <button onClick={removeLogo}
                style={{ background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', padding: '7px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}>
                🗑️ Quitar logo
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
          </div>
          <div style={{ fontSize: '.75rem', color: '#6b7280' }}>
            {logoStatus === 'ok' && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Logo subido. Recargá la página para verlo en el header.</span>}
            {logoStatus === 'error' && <span style={{ color: '#dc2626', fontWeight: 600 }}>✗ Error al subir. Verificá que el bucket "logos" existe en Storage (acceso público).</span>}
            {logoStatus === 'idle' && <span>El logo se guarda en Supabase Storage (bucket: logos).</span>}
          </div>
        </div>
      </div>

      {/* Datos empresa */}
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>Datos de la Empresa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>{F('Nombre de la empresa', 'nombre')}</div>
          {F('Validez de precios', 'validez')}
          {F('Tipo de cambio ARS/USD', 'tipo_cambio', 'number')}
          {F('Email de contacto', 'email', 'email')}
          {F('Teléfono', 'telefono')}
          <div style={{ gridColumn: '1/-1' }}>{F('Texto al pie de cotización', 'pie_cotizacion')}</div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={save} disabled={saving}
            style={{ background: '#003087', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Guardando…' : '💾 Guardar cambios'}
          </button>
          {ok && <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '.85rem' }}>✓ Guardado</span>}
        </div>
      </div>
    </div>
  )
}
