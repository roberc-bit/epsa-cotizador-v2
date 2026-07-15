'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      // Registrar actividad de login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('actividad').insert({
          usuario_id: user.id, tipo: 'login', detalle: 'Acceso al sistema'
        })
      }
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #003087 0%, #004db3 60%, #0066cc 100%)' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#003087' }}>ESCANDINAVIA DEL PLATA</div>
          <div style={{ fontSize: '.82rem', color: '#6b7280', marginTop: 4 }}>Volvo Construction Equipment</div>
          <div style={{ borderTop: '2px solid #e8f0fb', margin: '16px 0' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>Iniciar sesión</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 8, fontSize: '.92rem' }}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #dde3f0', borderRadius: 8, fontSize: '.92rem' }}
              placeholder="••••••••"
            />
          </div>
          {error && <div style={{ background: '#fce4e4', color: '#c62828', padding: '8px 12px', borderRadius: 6, fontSize: '.83rem' }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{ background: '#003087', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontSize: '.95rem', fontWeight: 600, cursor: 'pointer', marginTop: 4, opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
