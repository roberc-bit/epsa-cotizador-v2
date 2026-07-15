'use client'

interface Mod { label: string; delta: number }

interface Props {
  base: number
  mods: Mod[]
  totalConfigurado: number
  descuento: number
  onDescuentoChange: (v: number) => void
  onGenerarCotizacion: () => void
}

function fmt(n: number) {
  return 'USD ' + Math.round(n).toLocaleString('es-AR')
}

export default function PriceSidebar({ base, mods, totalConfigurado, descuento, onDescuentoChange, onGenerarCotizacion }: Props) {
  const descuentoAmt = totalConfigurado * (descuento / 100)
  const precioFinal = totalConfigurado - descuentoAmt

  return (
    <div style={{ width: 320, flexShrink: 0, background: '#fff', borderLeft: '1px solid #dde3f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Título */}
      <div style={{ background: '#003087', color: '#fff', padding: '16px 20px', fontWeight: 700, fontSize: '.95rem' }}>
        💰 Resumen de Precio
      </div>

      {/* Filas de precio (scroll si crecen mucho) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 0 }}>
        <PriceRow label="Precio de lista estándar" value={fmt(base)} />
        {mods.map((m, i) => (
          <PriceRow
            key={i}
            label={m.label.length > 36 ? m.label.slice(0, 36) + '…' : m.label}
            value={(m.delta >= 0 ? '+' : '') + fmt(m.delta)}
            color={m.delta >= 0 ? '#2e7d32' : '#e5001a'}
          />
        ))}
        {mods.length > 0 && (
          <PriceRow
            label="Diferencia neta"
            value={(mods.reduce((a, m) => a + m.delta, 0) >= 0 ? '+' : '') + fmt(mods.reduce((a, m) => a + m.delta, 0))}
            color={mods.reduce((a, m) => a + m.delta, 0) >= 0 ? '#2e7d32' : '#e5001a'}
            italic
          />
        )}
      </div>

      {/* Descuento */}
      <div style={{ padding: '14px 20px', borderTop: '2px dashed #dde3f0', background: '#fffbf0' }}>
        <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, color: '#6b7280', marginBottom: 8 }}>Descuento</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number" min={0} max={100} step={0.1}
            value={descuento || ''}
            placeholder="0"
            onChange={e => onDescuentoChange(parseFloat(e.target.value) || 0)}
            style={{ width: 80, padding: '6px 10px', border: '1px solid #dde3f0', borderRadius: 6, fontSize: '.95rem', fontWeight: 600, textAlign: 'right', background: '#fff' }}
          />
          <span style={{ fontWeight: 700, color: '#6b7280' }}>%</span>
          {descuento > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '.88rem', fontWeight: 600, color: '#e5001a' }}>
              − {fmt(descuentoAmt)}
            </span>
          )}
        </div>
      </div>

      {/* Total final */}
      <div style={{ background: descuento > 0 ? '#c8102e' : '#003087', color: '#fff', padding: '14px 20px' }}>
        <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: .5, opacity: .8 }}>
          {descuento > 0 ? `TOTAL CON ${descuento}% DESCUENTO` : 'TOTAL CONFIGURADO'}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 2 }}>{fmt(precioFinal)}</div>
      </div>

      {/* Botones */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #dde3f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onGenerarCotizacion}
          style={{ background: '#003087', color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}
        >
          📄 Generar Cotización
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: 'transparent', color: '#003087', border: '2px solid #003087', padding: 9, borderRadius: 8, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  )
}

function PriceRow({ label, value, color, italic }: { label: string; value: string; color?: string; italic?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px dashed #dde3f0', fontSize: '.83rem' }}>
      <span style={{ color: '#6b7280', flex: 1, paddingRight: 8, fontStyle: italic ? 'italic' : undefined }}>{label}</span>
      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: color ?? '#1a1a2e' }}>{value}</span>
    </div>
  )
}
