'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => setIsAdmin(d.rol === 'admin')).catch(() => {})
    fetch('/api/config').then(r => r.json()).then(d => setLogoUrl(d.logo_url ?? null)).catch(() => {})
  }, [])

  async function handleLogout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('actividad').insert({ usuario_id: user.id, tipo: 'logout', detalle: 'Cierre de sesión' })
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
    }}>{label}</Link>
  )

  return (
    <header style={{
      background: '#003087', color: '#fff',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', height: 64, gap: 18,
      boxShadow: '0 2px 12px rgba(0,0,0,.25)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ height: 42, maxWidth: 200, objectFit: 'contain' }} />
        ) : (
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'block' }}>ESCANDINAVIA DEL PLATA</span>
            <span style={{ fontSize: '.68rem', fontWeight: 400, opacity: .8, color: '#fff', display: 'block' }}>Volvo Construction Equipment</span>
          </div>
        )}
      </Link>

      <nav style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
        {navBtn('/', 'Inicio')}
        {navBtn('/lista-precios', 'Lista de Precios')}
        {isAdmin && navBtn('/admin', 'Administración')}
        <button onClick={handleLogout} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,.3)',
          color: '#fff', padding: '6px 14px', borderRadius: 20,
          cursor: 'pointer', fontSize: '.82rem'
        }}>Salir</button>
      </nav>
    </header>
  )
}
