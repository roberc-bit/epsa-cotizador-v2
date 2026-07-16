'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const AdminPanel = dynamic(() => import('./AdminPanel'), { ssr: false })

export default function AdminLoader() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/admin-data')
      .then(r => { if (!r.ok) throw new Error(r.status.toString()); return r.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  if (error) return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 28 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Acceso restringido</h2>
      <p style={{ color: '#6b7280', marginTop: 8 }}>Solo los administradores pueden acceder a este panel.</p>
    </div>
  )

  if (!data) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 28 }}>
      <div style={{ width: 300, height: 28, background: '#e5e7eb', borderRadius: 6, marginBottom: 24,
        animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ width: 110, height: 40, background: '#e5e7eb', borderRadius: '6px 6px 0 0',
            animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <div style={{ height: 400, background: '#f4f6fa', borderRadius: 8 }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )

  return <AdminPanel {...data} />
}
