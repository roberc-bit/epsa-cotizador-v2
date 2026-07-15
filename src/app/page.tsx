import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import type { Familia } from '@/lib/types'

const ICONS: Record<string, string> = {
  'camiones-articulados': '🚚',
  'excavadoras': '🏗️',
  'cargadoras': '🚜',
  'mini-excavadoras': '⛏️',
  'compactacion': '🛞',
}

export default async function HomePage() {
  const supabase = await createServerSupabase()
  const { data: familias } = await supabase
    .from('familias')
    .select('*')
    .eq('activo', true)
    .order('orden')

  const { data: empresa } = await supabase.from('empresa').select('nombre').single()

  return (
    <>
      <Header />
      <div style={{ background: 'linear-gradient(135deg, #003087 0%, #004db3 60%, #0066cc 100%)', color: '#fff', padding: '52px 28px 44px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Configurador de Equipos Volvo CE</h1>
        <p style={{ opacity: .8 }}>Seleccioná una categoría para explorar los modelos disponibles</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 28px' }}>
        <h2 style={{ fontSize: '1.05rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Categorías de Equipos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
          {(familias as Familia[])?.map(f => (
            <Link key={f.id} href={`/${f.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform .18s, box-shadow .18s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,48,135,.15)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>
                <div style={{ height: 120, background: f.imagen_url ? undefined : 'linear-gradient(135deg,#dde3f0,#c0ccee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative' }}>
                  {f.imagen_url
                    ? <Image src={f.imagen_url} alt={f.nombre} fill style={{ objectFit: 'cover' }} />
                    : ICONS[f.slug] ?? '🔧'}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontSize: '.92rem', fontWeight: 600, color: '#1a1a2e' }}>{f.nombre}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
