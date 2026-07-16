'use client'
import { useState } from 'react'
import TabEmpresa from './TabEmpresa'
import TabUsuarios from './TabUsuarios'
import TabPrecios from './TabPrecios'
import TabImagenes from './TabImagenes'
import TabActividad from './TabActividad'
import TabCotizaciones from './TabCotizaciones'

const TABS = [
  { id: 'empresa',       label: '🏢 Empresa' },
  { id: 'usuarios',      label: '👥 Usuarios' },
  { id: 'precios',       label: '📊 Precios' },
  { id: 'imagenes',      label: '🖼️ Imágenes' },
  { id: 'actividad',     label: '📋 Actividad' },
  { id: 'cotizaciones',  label: '📄 Cotizaciones' },
]

export default function AdminPanel({ empresa, perfiles, modelos, familias, actividad, cotizaciones, currentUserId }: any) {
  const [active, setActive] = useState('empresa')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 28 }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>⚙️ Panel de Administración</h2>
      <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 24 }}>Gestión de empresa, usuarios, precios, imágenes y actividad.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #dde3f0' }}>
        {TABS.map(t => (
          <button type="button" key={t.id} onClick={() => setActive(t.id)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            fontSize: '.88rem', fontWeight: active === t.id ? 700 : 500,
            color: active === t.id ? '#003087' : '#6b7280',
            background: active === t.id ? '#e8f0fb' : 'none',
            borderBottom: `2px solid ${active === t.id ? '#003087' : 'transparent'}`,
            marginBottom: -2, borderRadius: '6px 6px 0 0', transition: 'all .15s'
          }}>{t.label}</button>
        ))}
      </div>

      {active === 'empresa'      && <TabEmpresa empresa={empresa} />}
      {active === 'usuarios'     && <TabUsuarios perfiles={perfiles} currentUserId={currentUserId} />}
      {active === 'precios'      && <TabPrecios modelos={modelos} familias={familias} />}
      {active === 'imagenes'     && <TabImagenes modelos={modelos} familias={familias} />}
      {active === 'actividad'    && <TabActividad actividad={actividad} />}
      {active === 'cotizaciones' && <TabCotizaciones cotizaciones={cotizaciones} />}
    </div>
  )
}
