'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('actividad').insert({
        usuario_id: user.id, tipo: 'logout', detalle: 'Cierre de sesión'
      })
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navBtn = (href: string, label: string) => (
    <Link href={href} style={{
      background: pathname === href ? '#fff' : 'rgba(255,255,255,.12)',
      border: '1px solid rgba(255,255,255,.2)',
      color: pathname === href ? '#003087' : '#fff',
      padding: '6px 16px', borderRadius: 20,
      textDecoration: 'none', fontSize: '.85rem',
      fontWeight: pathname === href ? 600 : 400,
      transition: 'all .15s'
    }}>{label}</Link>
  )

  return (
    <header style={{
      background: '#003087', color: '#fff',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', height: 62, gap: 18,
      boxShadow: '0 2px 12px rgba(0,0,0,.25)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ fontSize: '1.18rem', fontWeight: 700, borderRight: '2px solid rgba(255,255,255,.25)', paddingRight: 18, lineHeight: 1.2 }}>
        ESCANDINAVIA DEL PLATA
        <span style={{ fontSize: '.72rem', fontWeight: 400, display: 'block', opacity: .8 }}>Volvo Construction Equipment</span>
      </div>
      <nav style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
        {navBtn('/', 'Inicio')}
        {navBtn('/lista-precios', 'Lista de Precios')}
        {navBtn('/admin', 'Administración')}
        <button onClick={handleLogout} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,.3)',
          color: '#fff', padding: '6px 14px', borderRadius: 20,
          cursor: 'pointer', fontSize: '.82rem'
        }}>Salir</button>
      </nav>
    </header>
  )
}
