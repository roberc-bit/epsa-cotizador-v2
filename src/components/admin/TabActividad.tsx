'use client'

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  login:        { background: '#e3f2fd', color: '#1565c0' },
  logout:       { background: '#f3e5f5', color: '#6a1b9a' },
  modelo_visto: { background: '#f3e5f5', color: '#6a1b9a' },
  cotizacion:   { background: '#e8f5e9', color: '#2e7d32' },
  lista_precios:{ background: '#fff8e1', color: '#e65100' },
}
const TYPE_LABEL: Record<string, string> = {
  login: 'Login', logout: 'Logout', modelo_visto: 'Modelo',
  cotizacion: 'Cotización', lista_precios: 'Lista Precios'
}

export default function TabActividad({ actividad }: { actividad: any[] }) {
  const stats = {
    cotizaciones: actividad.filter(a => a.tipo === 'cotizacion').length,
    logins: actividad.filter(a => a.tipo === 'login').length,
    listas: actividad.filter(a => a.tipo === 'lista_precios').length,
    modelos: actividad.filter(a => a.tipo === 'modelo_visto').length,
  }

  function exportExcel() {
    const rows = [['Fecha', 'Usuario', 'Email', 'Tipo', 'Detalle']]
    actividad.forEach(a => rows.push([
      new Date(a.created_at).toLocaleString('es-AR'),
      a.perfiles?.nombre ?? '—', a.perfiles?.email ?? '—',
      TYPE_LABEL[a.tipo] ?? a.tipo, a.detalle ?? ''
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'actividad_epsa.csv'; a.click()
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Cotizaciones', value: stats.cotizaciones },
          { label: 'Inicios de sesión', value: stats.logins },
          { label: 'Descargas lista', value: stats.listas },
          { label: 'Vistas de modelos', value: stats.modelos },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#003087' }}>{s.value}</div>
            <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>
          <h3 style={{ fontWeight: 700, color: '#003087' }}>Registro de Actividad</h3>
          <button type="button" onClick={exportExcel} style={{ background: 'transparent', color: '#003087', border: '2px solid #003087', padding: '6px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.78rem' }}>
            ⬇️ Exportar CSV
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
          <thead>
            <tr>{['Fecha/Hora', 'Usuario', 'Tipo', 'Detalle'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', borderBottom: '2px solid #dde3f0' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {actividad.map(a => (
              <tr key={a.id}>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', whiteSpace: 'nowrap', color: '#6b7280', fontSize: '.82rem' }}>
                  {new Date(a.created_at).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0' }}>{a.perfiles?.nombre ?? '—'}</td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0' }}>
                  <span style={{ ...TYPE_STYLE[a.tipo], fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' as const }}>{TYPE_LABEL[a.tipo] ?? a.tipo}</span>
                </td>
                <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', fontSize: '.83rem', color: '#374151' }}>{a.detalle ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
