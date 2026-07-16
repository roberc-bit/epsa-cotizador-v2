'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Configurator = dynamic(() => import('./Configurator'), { ssr: false })

interface Props { family: string; model: string }

export default function ConfiguratorLoader({ family, model }: Props) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/configurator/${family}/${model}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [family, model])

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
      Error al cargar el equipo. <button type="button" onClick={() => window.location.reload()}
        style={{ color: '#003087', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Reintentar
      </button>
    </div>
  )

  if (!data) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
      {/* Skeleton del hero */}
      <div style={{ height: 140, background: 'linear-gradient(135deg,#0a1628,#003087)', borderRadius: 12, marginBottom: 20,
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16 }}>
        <div>
          <div style={{ width: 120, height: 12, background: 'rgba(255,255,255,.2)', borderRadius: 6, marginBottom: 10 }} />
          <div style={{ width: 280, height: 28, background: 'rgba(255,255,255,.25)', borderRadius: 6 }} />
        </div>
      </div>
      {/* Skeleton de 2 columnas */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 60, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
              animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ width: 320, height: 400, background: '#fff', border: '1px solid #dde3f0', borderRadius: 12 }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )

  return <Configurator {...data} />
}
