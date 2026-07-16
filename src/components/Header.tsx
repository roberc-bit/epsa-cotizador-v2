'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? ''
const VOLVO_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Volvo_Car_logo.svg/120px-Volvo_Car_logo.svg.png'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setIsAdmin(d.rol === 'admin'))
      .catch(() => {})
  }, [])

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
      padding: '0 28px', height: 64, gap: 18,
      boxShadow: '0 2px 12px rgba(0,0,0,.25)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* Logo / brand */}
      <div style={{ borderRight: '2px solid rgba(255,255,255,.25)', paddingRight: 18, lineHeight: 1.2, flexShrink: 0 }}>
        {LOGO_URL ? (
          <img src={LOGO_URL} alt="Escandinavia del Plata" style={{ height: 38, maxWidth: 180, objectFit: 'contain' }} />
        ) : (
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>ESCANDINAVIA DEL PLATA</span>
            <span style={{ fontSize: '.7rem', fontWeight: 400, display: 'block', opacity: .8 }}>Volvo Construction Equipment</span>
          </div>
        )}
      </div>

      {/* Volvo logo */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Volvo_logo.png/240px-Volvo_logo.png"
        alt="Volvo"
        style={{ height: 28, opacity: .9, filter: 'brightness(0) invert(1)' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

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
