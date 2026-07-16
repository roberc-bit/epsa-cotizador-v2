import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import Header from '@/components/Header'
import { fmtUSD } from '@/lib/utils'
import dynamic from 'next/dynamic'
const PrintButton = dynamic(() => import('@/components/PrintButton'), { ssr: false })

export default async function ListaPreciosPage() {
  const supabase = await createServerSupabase()
  const admin = createAdminSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: familias }, { data: modelos }, { data: empresa }] = await Promise.all([
    admin.from('familias').select('id, nombre, slug').eq('activo', true).order('orden'),
    admin.from('modelos').select('*, familias(nombre)').eq('activo', true).order('codigo'),
    admin.from('empresa').select('*').single(),
  ])

  // Log actividad
  if (user) {
    await supabase.from('actividad').insert({
      usuario_id: user.id, tipo: 'lista_precios', detalle: 'Descarga/vista lista de precios'
    })
  }

  const byFamily = (familiaId: string) =>
    (modelos ?? []).filter((m: any) => m.familia_id === familiaId)

  return (
    <>
      <Header />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>Lista de Precios — Vigente</h2>
            <p style={{ color: '#6b7280', fontSize: '.85rem' }}>
              Precios en USD · Validez: {empresa?.validez ?? '—'} · TC referencial: ARS {empresa?.tipo_cambio?.toLocaleString('es-AR') ?? '—'} / USD
            </p>
          </div>
          <PrintButton />
        </div>

        {(familias ?? []).map((f: any) => {
          const fModelos = byFamily(f.id)
          if (!fModelos.length) return null
          return (
            <div key={f.id} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#003087', marginBottom: 10 }}>{f.nombre}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)' }}>
                <thead>
                  <tr style={{ background: '#003087', color: '#fff' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Código</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Modelo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Precio Lista</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>Precio Lista</th>
                  </tr>
                </thead>
                <tbody>
                  {fModelos.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #dde3f0' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: '.85rem', color: '#6b7280' }}>{m.codigo}</td>
                      <td style={{ padding: '11px 16px', fontSize: '.9rem' }}>{m.nombre}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: '.88rem', color: '#6b7280' }}>{m.precio_fob ? fmtUSD(m.precio_fob) : '—'}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: '#003087', fontSize: '.95rem' }}>{fmtUSD(m.precio_lista)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}

        <p style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 20, lineHeight: 1.6 }}>
          {empresa?.pie_cotizacion}
        </p>
      </div>
    </>
  )
}
