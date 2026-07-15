'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TabUsuarios({ perfiles, currentUserId }: { perfiles: any[]; currentUserId: string }) {
  const [list, setList] = useState(perfiles)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' })
  const [creating, setCreating] = useState(false)
  const sb = createClient()

  async function createUser() {
    setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.perfil) setList(p => [...p, data.perfil])
    setForm({ nombre: '', email: '', password: '', rol: 'vendedor' })
    setCreating(false)
  }

  async function toggleActivo(id: string, activo: boolean) {
    await sb.from('perfiles').update({ activo: !activo }).eq('id', id)
    setList(p => p.map(u => u.id === id ? { ...u, activo: !activo } : u))
  }

  const Badge = ({ rol }: { rol: string }) => (
    <span style={{ background: rol === 'admin' ? '#e8f0fb' : '#fff8e1', color: rol === 'admin' ? '#003087' : '#e65100', border: `1px solid ${rol === 'admin' ? '#90caf9' : '#ffcc80'}`, fontSize: '.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' as const }}>{rol}</span>
  )
  const StatusBadge = ({ activo }: { activo: boolean }) => (
    <span style={{ background: activo ? '#e8f5e9' : '#fce4e4', color: activo ? '#2e7d32' : '#c62828', border: `1px solid ${activo ? '#a5d6a7' : '#ef9a9a'}`, fontSize: '.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' as const }}>{activo ? 'Activo' : 'Inactivo'}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Crear usuario */}
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>Crear nuevo usuario</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {(['nombre', 'email', 'password'] as const).map(k => (
            <div key={k}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', display: 'block', marginBottom: 6 }}>{k === 'password' ? 'Contraseña' : k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <input type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
                value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', display: 'block', marginBottom: 6 }}>Rol</label>
            <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.9rem', background: '#f4f6fa' }}>
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <button onClick={createUser} disabled={creating}
          style={{ marginTop: 16, background: '#003087', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {creating ? 'Creando…' : '✚ Crear usuario'}
        </button>
      </div>

      {/* Lista */}
      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>Usuarios del sistema</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
          <thead>
            <tr>{['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', borderBottom: '2px solid #dde3f0' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {list.map((u: any) => (
              <tr key={u.id}>
                <td style={{ padding: '11px 14px', fontWeight: 600, borderBottom: '1px solid #dde3f0' }}>{u.nombre}</td>
                <td style={{ padding: '11px 14px', color: '#6b7280', borderBottom: '1px solid #dde3f0' }}>{u.email}</td>
                <td style={{ padding: '11px 14px', borderBottom: '1px solid #dde3f0' }}><Badge rol={u.rol} /></td>
                <td style={{ padding: '11px 14px', borderBottom: '1px solid #dde3f0' }}><StatusBadge activo={u.activo} /></td>
                <td style={{ padding: '11px 14px', borderBottom: '1px solid #dde3f0' }}>
                  {u.id !== currentUserId && (
                    <button onClick={() => toggleActivo(u.id, u.activo)}
                      style={{ background: 'none', border: '1px solid #dde3f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '.78rem', color: '#6b7280' }}>
                      {u.activo ? '⛔ Desactivar' : '✅ Activar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
