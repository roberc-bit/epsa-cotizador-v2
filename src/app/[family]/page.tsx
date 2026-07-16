import { createAdminSupabase } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { fmtUSD } from '@/lib/utils'

export default async function FamilyPage({ params }: { params: Promise<{ family: string }> }) {
  const { family } = await params
  const supabase = createAdminSupabase()

  const { data: familia } = await supabase
    .from('familias').select('*').eq('slug', family).single()
  if (!familia) notFound()

  const { data: modelos } = await supabase
    .from('modelos').select('*')
    .eq('familia_id', familia.id).eq('activo', true)
    .order('codigo')

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px' }}>
        <div style={{ fontSize: '.82rem', color: '#6b7280', marginBottom: 20 }}>
          <Link href="/" style={{ color: '#003087', textDecoration: 'none' }}>Inicio</Link>
          {' › '}<span>{familia.nombre}</span>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24 }}>{familia.nombre}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 20 }}>
          {modelos?.map((m: any) => (
            <Link key={m.id} href={`/${family}/${m.codigo}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ height: 160, background: 'linear-gradient(135deg,#dde3f0,#b8c8ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {m.imagen_url
                    ? <Image src={m.imagen_url} alt={m.nombre} fill style={{ objectFit: 'cover' }} />
                    : <span style={{ fontSize: '3.5rem' }}>🏗️</span>}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{m.codigo}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, margin: '4px 0 6px' }}>{m.nombre}</div>
                  {m.descripcion && <div style={{ fontSize: '.82rem', color: '#6b7280' }}>{m.descripcion}</div>}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #dde3f0' }}>
                    Precio Lista: <span style={{ fontWeight: 700, color: '#003087' }}>{fmtUSD(m.precio_lista)}</span>
                    
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
