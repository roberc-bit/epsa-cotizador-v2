'use client'
import { useState } from 'react'
import type { Modelo, Empresa, ItemCotizado } from '@/lib/types'

interface Props {
  modelo: Modelo
  totalConfigurado: number
  descuento: number
  precioFinal: number
  itemsSnapshot: ItemCotizado[]
  userId: string
  empresa: Empresa
  onClose: () => void
}

function fmt(n: number) { return 'USD ' + Math.round(n).toLocaleString('es-AR') }
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) }

export default function QuoteModal({ modelo, totalConfigurado, descuento, precioFinal, itemsSnapshot, userId, empresa, onClose }: Props) {
  const [emailCliente, setEmailCliente] = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [emailVendedor, setEmailVendedor] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState<number | null>(null)

  async function handleSend() {
    if (!isValidEmail(emailCliente)) { setEmailError(true); return }
    setSending(true)
    try {
      const res = await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailCliente: emailCliente.trim(),
          nombreCliente: nombreCliente.trim() || emailCliente.trim(),
          emailVendedor: emailVendedor.trim() || null,
          modeloId: modelo.id,
          modeloNombre: modelo.nombre,
          modeloCodigo: modelo.codigo,
          itemsJson: itemsSnapshot,
          precioBase: totalConfigurado,
          precioTotal: totalConfigurado,
          descuentoPct: descuento,
          precioFinal,
          userId,
        })
      })
      const data = await res.json()
      setQuoteNumber(data.numero ?? null)
      setSent(true)
    } catch {
      alert('Error al enviar. Por favor intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 460, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>

        {!sent ? (
          <>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>📄 Generar y Enviar Cotización</h3>
            <p style={{ fontSize: '.83rem', color: '#6b7280', marginBottom: 20 }}>Se generará el PDF y se enviará automáticamente al email indicado.</p>

            {/* Precio box */}
            <div style={{ background: '#003087', color: '#fff', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '.78rem', opacity: .8 }}>Equipo configurado</div>
                <div style={{ fontSize: '.85rem', opacity: .85, marginTop: 2 }}>{modelo.nombre}</div>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {descuento > 0 ? `${fmt(precioFinal)} (−${descuento}%)` : fmt(precioFinal)}
              </div>
            </div>

            <Field label="Email del cliente *">
              <input type="email" value={emailCliente}
                onChange={e => { setEmailCliente(e.target.value); setEmailError(false) }}
                placeholder="cliente@empresa.com"
                style={{ ...inputStyle, borderColor: emailError ? '#e5001a' : '#dde3f0' }}
              />
              {emailError && <div style={{ fontSize: '.75rem', color: '#e5001a', marginTop: 4 }}>Ingresá un email válido para continuar.</div>}
            </Field>

            <Field label="Nombre del cliente">
              <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
                placeholder="Ej: Minera del Sur S.A." style={inputStyle} />
            </Field>

            <hr style={{ border: 'none', borderTop: '1px dashed #dde3f0', margin: '14px 0' }} />

            <Field label="Enviar copia al vendedor">
              <input type="email" value={emailVendedor} onChange={e => setEmailVendedor(e.target.value)}
                placeholder="vendedor@epsa.com.ar" style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={onClose} style={{ ...btnSecondary }}>Cancelar</button>
              <button type="button" onClick={handleSend} disabled={sending} style={{ ...btnPrimary, flex: 1, opacity: sending ? .7 : 1 }}>
                {sending ? '⏳ Enviando…' : '✉️ Enviar cotización'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2e7d32', marginBottom: 6 }}>¡Cotización enviada!</h4>
            {quoteNumber && <div style={{ fontSize: '.82rem', color: '#6b7280', marginBottom: 8 }}>Número de cotización: <strong>#{String(quoteNumber).padStart(5, '0')}</strong></div>}
            <p style={{ fontSize: '.85rem', color: '#6b7280', lineHeight: 1.5 }}>
              Se envió la cotización de <strong>{modelo.nombre}</strong> por <strong>{fmt(precioFinal)}</strong> a <strong>{emailCliente}</strong>
              {emailVendedor ? ` con copia a ${emailVendedor}` : ''}.
            </p>
            <button type="button" onClick={onClose} style={{ ...btnSecondary, marginTop: 18, width: '100%' }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #dde3f0',
  borderRadius: 8, fontSize: '.92rem', background: '#f4f6fa', color: '#1a1a2e',
}
const btnPrimary: React.CSSProperties = {
  background: '#003087', color: '#fff', border: 'none', padding: '12px 18px',
  borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#003087', border: '2px solid #003087',
  padding: '10px 18px', borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, color: '#6b7280', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
