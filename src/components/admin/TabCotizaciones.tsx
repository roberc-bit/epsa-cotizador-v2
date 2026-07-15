'use client'

function fmt(n: number) { return 'USD ' + Math.round(n).toLocaleString('es-AR') }

export default function TabCotizaciones({ cotizaciones }: { cotizaciones: any[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, padding: 24 }}>
      <h3 style={{ fontWeight: 700, color: '#003087', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #dde3f0' }}>Historial de Cotizaciones</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
        <thead>
          <tr>{['Nº', 'Fecha', 'Vendedor', 'Modelo', 'Cliente', 'Total', 'Email'].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6b7280', borderBottom: '2px solid #dde3f0' }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {cotizaciones.map((c: any) => (
            <tr key={c.id}>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', fontWeight: 700 }}>#{String(c.numero).padStart(5, '0')}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', color: '#6b7280', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                {new Date(c.created_at).toLocaleDateString('es-AR')}
              </td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0' }}>{c.perfiles?.nombre ?? '—'}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', fontFamily: 'monospace', fontSize: '.82rem' }}>{c.modelos?.codigo}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0' }}>{c.cliente_nombre ?? '—'}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0', fontWeight: 700, color: '#003087' }}>{fmt(c.precio_final)}</td>
              <td style={{ padding: '10px 14px', borderBottom: '1px solid #dde3f0' }}>
                <span style={{ background: c.email_enviado ? '#e8f5e9' : '#f4f6fa', color: c.email_enviado ? '#2e7d32' : '#6b7280', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                  {c.email_enviado ? '✓ Enviado' : 'No enviado'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
