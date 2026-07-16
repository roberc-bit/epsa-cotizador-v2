'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabEmpresa({ empresa }: { empresa: any }) {
  const [form, setForm] = useState({ ...empresa })
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(empresa?.logo_url ?? null)
  const logoRef = useRef<HTMLInputElement>(null)
  const sb = createClient()

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

  async function uploadLogo(file: File) {
    setLogoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `logo.${ext}`
    const { error } = await sb.storage.from('logos').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = sb.storage.from('logos').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      // Try to save to empresa.logo_url (requires migration)
      await sb.from('empresa').update({ logo_url: url } as any).eq('id', 1)
      setLogoUrl(url)
    } else {
      alert('Error al subir logo: ' + error.message)
    }
    setLogoUploading(false)
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
          Aparece en el encabezado reemplazando el texto "ESCANDINAVIA DEL PLATA". PNG o SVG con fondo transparente recomendado.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 220, height: 64, background: '#003087', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 16px'
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ maxHeight: 48, maxWidth: 190, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              : <span style={{ color: '#fff', fontSize: '.8rem', opacity: .6 }}>Sin logo</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => logoRef.current?.click()}
              disabled={logoUploading}
              style={{ background: '#003087', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}
            >
              {logoUploading ? 'Subiendo…' : '📷 Subir logo'}
            </button>
            {logoUrl && (
              <button
                onClick={async () => {
                  await sb.from('empresa').update({ logo_url: null } as any).eq('id', 1)
                  setLogoUrl(null)
                }}
                style={{ background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', padding: '7px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}
              >
                🗑️ Quitar logo
              </button>
            )}
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
            />
          </div>
          {logoUrl && (
            <div style={{ fontSize: '.75rem', color: '#6b7280', wordBreak: 'break-all', maxWidth: 260 }}>
              <strong>Vista previa en header:</strong><br />
              <span style={{ opacity: .7 }}>El logo aparece con filtro blanco sobre el fondo azul.</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: '.78rem', color: '#713f12' }}>
          ⚠️ <strong>Requisito:</strong> ejecutá este SQL en el editor de Supabase antes de usar esta función:<br />
          <code style={{ display: 'block', marginTop: 6, background: '#fff', padding: '6px 10px', borderRadius: 4, fontFamily: 'monospace' }}>
            ALTER TABLE empresa ADD COLUMN IF NOT EXISTS logo_url text;
          </code>
          <span style={{ marginTop: 4, display: 'block' }}>También creá el bucket <strong>logos</strong> en Storage con acceso público.</span>
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
