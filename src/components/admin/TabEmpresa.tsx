'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabEmpresa({ empresa }: { empresa: any }) {
  const [form, setForm] = useState({ ...empresa })
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
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

  const F = (label: string, key: string, type = 'text') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: .4, color: '#6b7280' }}>{label}</label>
      <input type={type} value={form[key] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [key]: e.target.value }))}
        style={{ padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }} />
    </div>
  )

  return (
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
  )
}
