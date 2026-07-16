'use client'
import { useState, useMemo } from 'react'
import type { Item, Modelo, Familia, Empresa } from '@/lib/types'

interface ConfiguratorProps {
  modelo: Modelo
  items: Item[]
  familia: Familia
  empresa: Empresa | null
  userId: string
}

interface DDGroup { label: string; items: Item[]; defaultItem: Item | null }

function fmt(n: number) {
  return 'USD ' + Math.round(n).toLocaleString('es-AR')
}

export default function Configurator({ modelo, items, empresa, userId }: ConfiguratorProps) {

  // ── Classify ──────────────────────────────────────────────────────
  const fijos = useMemo(() =>
    items.filter(i => i.tipo === 'fijo').sort((a, b) => a.orden - b.orden), [items])

  const ddGroupMap = useMemo(() => {
    const map = new Map<string, Item[]>()
    items.filter(i => i.tipo === 'dropdown').forEach(i => {
      const k = i.grupo_dropdown ?? 'Opción'
      const arr = map.get(k) ?? []; arr.push(i); map.set(k, arr)
    })
    map.forEach((arr, k) => map.set(k, arr.sort((a, b) => a.orden - b.orden)))
    return map
  }, [items])

  const sec2Dropdowns = useMemo((): DDGroup[] =>
    [...ddGroupMap.entries()]
      .filter(([, its]) => its.some(i => i.es_default))
      .map(([label, its]) => ({ label, items: its, defaultItem: its.find(i => i.es_default) ?? null })),
    [ddGroupMap])

  const sec3Dropdowns = useMemo(() =>
    [...ddGroupMap.entries()].filter(([, its]) => !its.some(i => i.es_default)),
    [ddGroupMap])

  const sec2Checks = useMemo(() =>
    items.filter(i => i.tipo === 'configurable' && i.es_default).sort((a, b) => a.orden - b.orden), [items])

  const sec3Checks = useMemo(() =>
    items.filter(i => (i.tipo === 'configurable' || i.tipo === 'opcional') && !i.es_default).sort((a, b) => a.orden - b.orden), [items])

  // ── State ─────────────────────────────────────────────────────────
  const [sec1Open, setSec1Open] = useState(false)
  const [sec2Open, setSec2Open] = useState(true)
  const [sec3Open, setSec3Open] = useState(false)

  const initDdSel = useMemo(() => {
    const m: Record<string, string | null> = {}
    sec2Dropdowns.forEach(g => { m[g.label] = g.defaultItem?.codigo ?? null })
    sec3Dropdowns.forEach(([label]) => { m[label] = null })
    return m
  }, [sec2Dropdowns, sec3Dropdowns])
  const [ddSel, setDdSel] = useState<Record<string, string | null>>(initDdSel)

  const initCheckSel = useMemo(() => {
    const m: Record<string, boolean> = {}
    sec2Checks.forEach(i => { m[i.codigo] = true })
    sec3Checks.forEach(i => { m[i.codigo] = false })
    return m
  }, [sec2Checks, sec3Checks])
  const [checkSel, setCheckSel] = useState<Record<string, boolean>>(initCheckSel)

  const allSec3Sections = useMemo(() => {
    const secs = new Set<string>()
    sec3Dropdowns.forEach(([, its]) => its.forEach(i => i.seccion && secs.add(i.seccion)))
    sec3Checks.forEach(i => i.seccion && secs.add(i.seccion))
    return [...secs]
  }, [sec3Dropdowns, sec3Checks])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const [descuentoPct, setDescuentoPct] = useState(0)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [quoteResult, setQuoteResult] = useState<{ success?: boolean; numero?: number; error?: string } | null>(null)

  // ── Pricing ────────────────────────────────────────────────────────
  const { total, precioFinal } = useMemo(() => {
    const base = modelo.precio_lista
    let cfgDdDelta = 0
    sec2Dropdowns.forEach(g => {
      const sel = g.items.find(i => i.codigo === ddSel[g.label])
      if (sel && g.defaultItem) cfgDdDelta += sel.precio_lista - g.defaultItem.precio_lista
    })
    let cfgCheckDelta = 0
    sec2Checks.forEach(i => { if (!checkSel[i.codigo]) cfgCheckDelta -= i.precio_lista })
    let opcDdDelta = 0
    sec3Dropdowns.forEach(([label, its]) => {
      const sel = its.find(i => i.codigo === ddSel[label])
      if (sel) opcDdDelta += sel.precio_lista
    })
    let opcCheckDelta = 0
    sec3Checks.forEach(i => { if (checkSel[i.codigo]) opcCheckDelta += i.precio_lista })
    const t = base + cfgDdDelta + cfgCheckDelta + opcDdDelta + opcCheckDelta
    return { total: t, precioFinal: descuentoPct > 0 ? t * (1 - descuentoPct / 100) : t }
  }, [modelo.precio_lista, sec2Dropdowns, sec3Dropdowns, sec2Checks, sec3Checks, ddSel, checkSel, descuentoPct])

  // ── Sec3 grouping ──────────────────────────────────────────────────
  const sec3BySec = useMemo(() => {
    const map = new Map<string, { dropdowns: [string, Item[]][]; checks: Item[] }>()
    allSec3Sections.forEach(s => map.set(s, { dropdowns: [], checks: [] }))
    sec3Dropdowns.forEach(([label, its]) => {
      const s = its[0]?.seccion ?? 'Otros'
      const e = map.get(s) ?? { dropdowns: [], checks: [] }
      e.dropdowns.push([label, its]); map.set(s, e)
    })
    sec3Checks.forEach(i => {
      const s = i.seccion ?? 'Otros'
      const e = map.get(s) ?? { dropdowns: [], checks: [] }
      e.checks.push(i); map.set(s, e)
    })
    return map
  }, [allSec3Sections, sec3Dropdowns, sec3Checks])

  // ── Quote ──────────────────────────────────────────────────────────
  async function handleSendQuote() {
    if (!clienteNombre || !clienteEmail) return
    setSending(true); setQuoteResult(null)
    try {
      const itemsJson: any[] = []
      fijos.forEach(i => itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'fijo', precio_lista: i.precio_lista, incluido: true }))
      sec2Dropdowns.forEach(g => {
        const sel = g.items.find(i => i.codigo === ddSel[g.label]) ?? g.defaultItem
        if (sel) itemsJson.push({ codigo: sel.codigo, descripcion: sel.descripcion, tipo: 'dropdown', precio_lista: sel.precio_lista - (g.defaultItem?.precio_lista ?? 0), incluido: true })
      })
      sec2Checks.forEach(i => itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'configurable', precio_lista: i.precio_lista, incluido: checkSel[i.codigo] ?? true }))
      sec3Dropdowns.forEach(([label, its]) => {
        const sel = its.find(i => i.codigo === ddSel[label])
        if (sel) itemsJson.push({ codigo: sel.codigo, descripcion: sel.descripcion, tipo: 'dropdown', precio_lista: sel.precio_lista, incluido: false })
      })
      sec3Checks.forEach(i => { if (checkSel[i.codigo]) itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'opcional', precio_lista: i.precio_lista, incluido: false }) })

      const res = await fetch('/api/quote/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailCliente: clienteEmail, nombreCliente: clienteNombre,
          emailVendedor: empresa?.email ?? null,
          modeloNombre: modelo.nombre, modeloCodigo: modelo.codigo,
          itemsJson, precioBase: modelo.precio_lista, precioTotal: total,
          descuentoPct, precioFinal, userId, modeloId: modelo.id,
        }),
      })
      const data = await res.json()
      setQuoteResult(data.success ? { success: true, numero: data.numero } : { error: data.error ?? 'Error al enviar' })
    } catch (e: any) {
      setQuoteResult({ error: e.message })
    } finally { setSending(false) }
  }

  // ── Styles ─────────────────────────────────────────────────────────
  const S = {
    card: { background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, overflow: 'hidden' as const, marginBottom: 12 },
    sectionBtn: (open: boolean): React.CSSProperties => ({
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: open ? '#f0f4ff' : '#f4f6fa',
      border: 'none', cursor: 'pointer', textAlign: 'left' as const,
      borderBottom: open ? '1px solid #dde3f0' : 'none',
    }),
    label: { fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: .5, color: '#6b7280', display: 'block', marginBottom: 6 },
    select: { width: '100%', padding: '8px 10px', border: '1px solid #dde3f0', borderRadius: 7, fontSize: '.88rem', background: '#fff', outline: 'none' },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #dde3f0', borderRadius: 7, fontSize: '.9rem', boxSizing: 'border-box' as const },
    badge: (pos: boolean): React.CSSProperties => ({ fontSize: '.75rem', fontWeight: 700, color: pos ? '#dc2626' : '#16a34a', marginLeft: 6 }),
  }

  const sec2Count = sec2Dropdowns.length + sec2Checks.length
  const sec3Count = [...sec3BySec.values()].reduce((a, v) => a + v.dropdowns.length + v.checks.length, 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>

      {/* MODEL HEADER */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {modelo.imagen_url && (
          <img src={modelo.imagen_url} alt={modelo.codigo} style={{ height: 80, width: 120, objectFit: 'cover', borderRadius: 8 }} />
        )}
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{modelo.codigo}</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '.9rem' }}>{modelo.nombre}</p>
        </div>
      </div>

      {/* PRICE BOX */}
      <div style={{ background: '#003087', color: '#fff', borderRadius: 12, padding: '18px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '.75rem', opacity: .7, textTransform: 'uppercase', letterSpacing: 1 }}>Precio configurado</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 2 }}>{fmt(total)}</div>
          {descuentoPct > 0 && (
            <div style={{ fontSize: '.9rem', color: '#86efac', marginTop: 4 }}>
              Con {descuentoPct}% descuento: <strong>{fmt(precioFinal)}</strong>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', opacity: .8 }}>
          <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>Precio de lista base</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 2 }}>{fmt(modelo.precio_lista)}</div>
        </div>
      </div>

      {/* SECTION 1 */}
      <div style={S.card}>
        <button style={S.sectionBtn(sec1Open)} onClick={() => setSec1Open(p => !p)}>
          <span>
            <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#003087', textTransform: 'uppercase', letterSpacing: .5 }}>
              Equipamiento de serie no configurable
            </span>
            <span style={{ marginLeft: 10, fontSize: '.78rem', color: '#9ca3af' }}>{fijos.length} ítems</span>
          </span>
          <span style={{ color: '#9ca3af', fontSize: '.8rem' }}>{sec1Open ? '▲' : '▼'}</span>
        </button>
        {sec1Open && (
          <div>
            {fijos.map((item, i) => (
              <div key={item.codigo} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < fijos.length - 1 ? '1px solid #f4f6fa' : 'none' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: '.87rem', color: '#374151', flex: 1 }}>{item.descripcion}</span>
                <span style={{ fontSize: '.72rem', color: '#d1d5db', fontFamily: 'monospace' }}>{item.codigo}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2 */}
      <div style={S.card}>
        <button style={S.sectionBtn(sec2Open)} onClick={() => setSec2Open(p => !p)}>
          <span>
            <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#003087', textTransform: 'uppercase', letterSpacing: .5 }}>
              Equipamiento de serie configurable
            </span>
            <span style={{ marginLeft: 10, fontSize: '.78rem', color: '#9ca3af' }}>{sec2Count} ítems</span>
          </span>
          <span style={{ color: '#9ca3af', fontSize: '.8rem' }}>{sec2Open ? '▲' : '▼'}</span>
        </button>
        {sec2Open && (
          <div>
            {/* Dropdowns */}
            {sec2Dropdowns.map((group, i) => {
              const selCode = ddSel[group.label]
              const selItem = group.items.find(it => it.codigo === selCode) ?? group.defaultItem
              const delta = selItem && group.defaultItem ? selItem.precio_lista - group.defaultItem.precio_lista : 0
              return (
                <div key={group.label} style={{ padding: '12px 16px', borderBottom: '1px solid #f4f6fa' }}>
                  <label style={S.label}>{group.label}</label>
                  <select
                    value={selCode ?? ''}
                    onChange={e => setDdSel(p => ({ ...p, [group.label]: e.target.value || null }))}
                    style={S.select}
                  >
                    {group.items.map(it => {
                      const d = it.precio_lista - (group.defaultItem?.precio_lista ?? 0)
                      const suffix = it.es_default ? ' (incluido)' : d !== 0 ? ` (${d > 0 ? '+' : ''}${fmt(d)})` : ''
                      return <option key={it.codigo} value={it.codigo}>{it.descripcion}{suffix}</option>
                    })}
                  </select>
                  {delta !== 0 && (
                    <span style={S.badge(delta > 0)}>{delta > 0 ? '+' : ''}{fmt(delta)}</span>
                  )}
                </div>
              )
            })}
            {/* Checkboxes */}
            {sec2Checks.map((item, i) => (
              <label key={item.codigo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', borderBottom: i < sec2Checks.length - 1 ? '1px solid #f4f6fa' : 'none', background: checkSel[item.codigo] === false ? '#fef2f2' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={checkSel[item.codigo] ?? true}
                  onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#003087', flexShrink: 0 }}
                />
                <span style={{ fontSize: '.87rem', color: checkSel[item.codigo] === false ? '#9ca3af' : '#374151', flex: 1, textDecoration: checkSel[item.codigo] === false ? 'line-through' : 'none' }}>
                  {item.descripcion}
                </span>
                {checkSel[item.codigo] === false && (
                  <span style={{ fontSize: '.78rem', color: '#16a34a', fontWeight: 700 }}>{fmt(-item.precio_lista)}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3 */}
      <div style={S.card}>
        <button style={S.sectionBtn(sec3Open)} onClick={() => setSec3Open(p => !p)}>
          <span>
            <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#003087', textTransform: 'uppercase', letterSpacing: .5 }}>
              Opcionales adicionales
            </span>
            <span style={{ marginLeft: 10, fontSize: '.78rem', color: '#9ca3af' }}>{sec3Count} ítems</span>
          </span>
          <span style={{ color: '#9ca3af', fontSize: '.8rem' }}>{sec3Open ? '▲' : '▼'}</span>
        </button>
        {sec3Open && (
          <div>
            {allSec3Sections.map(sec => {
              const { dropdowns, checks } = sec3BySec.get(sec) ?? { dropdowns: [], checks: [] }
              const isOpen = openSections[sec] ?? false
              return (
                <div key={sec} style={{ borderBottom: '1px solid #f4f6fa' }}>
                  <button
                    onClick={() => setOpenSections(p => ({ ...p, [sec]: !p[sec] }))}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f9fafb', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '.87rem', fontWeight: 600, color: '#374151' }}>{sec}</span>
                    <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div>
                      {dropdowns.map(([label, its]) => (
                        <div key={label} style={{ padding: '12px 16px', borderTop: '1px solid #f4f6fa' }}>
                          <label style={S.label}>{label}</label>
                          <select
                            value={ddSel[label] ?? ''}
                            onChange={e => setDdSel(p => ({ ...p, [label]: e.target.value || null }))}
                            style={S.select}
                          >
                            <option value="">No agregar</option>
                            {its.map(it => (
                              <option key={it.codigo} value={it.codigo}>
                                {it.descripcion} — {fmt(it.precio_lista)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                      {checks.map((item, i) => (
                        <label key={item.codigo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer', borderTop: '1px solid #f4f6fa', background: checkSel[item.codigo] ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={checkSel[item.codigo] ?? false}
                            onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: '#003087', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '.87rem', color: '#374151', flex: 1 }}>{item.descripcion}</span>
                          <span style={{ fontSize: '.78rem', fontWeight: 700, color: checkSel[item.codigo] ? '#dc2626' : '#d1d5db' }}>
                            {checkSel[item.codigo] ? '+' : ''}{fmt(item.precio_lista)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QUOTE FORM */}
      <div style={{ ...S.card, marginTop: 20 }}>
        <div style={{ padding: '12px 16px', background: '#f4f6fa', borderBottom: '1px solid #dde3f0' }}>
          <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#003087', textTransform: 'uppercase', letterSpacing: .5 }}>
            Generar Cotización
          </span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={S.label}>Nombre del cliente</label>
              <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                placeholder="Empresa / Persona" style={S.input} />
            </div>
            <div>
              <label style={S.label}>Email del cliente</label>
              <input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)}
                placeholder="cliente@empresa.com" style={S.input} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <label style={{ ...S.label, margin: 0, whiteSpace: 'nowrap' }}>Descuento (%)</label>
            <input type="number" min={0} max={50} value={descuentoPct}
              onChange={e => setDescuentoPct(Number(e.target.value))}
              style={{ ...S.input, width: 90 }} />
            {descuentoPct > 0 && (
              <span style={{ fontSize: '.88rem', color: '#16a34a', fontWeight: 600 }}>
                → Total con descuento: {fmt(precioFinal)}
              </span>
            )}
          </div>
          <button
            onClick={handleSendQuote}
            disabled={sending || !clienteNombre || !clienteEmail}
            style={{
              width: '100%', background: (!clienteNombre || !clienteEmail) ? '#9ca3af' : '#003087',
              color: '#fff', border: 'none', padding: '12px', borderRadius: 8,
              fontWeight: 700, fontSize: '.95rem', cursor: (!clienteNombre || !clienteEmail) ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Enviando…' : 'Enviar Cotización por Email'}
          </button>
          {quoteResult?.success && (
            <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: 8, padding: '10px 14px', fontSize: '.88rem' }}>
              ✓ Cotización #{String(quoteResult.numero).padStart(5, '0')} enviada correctamente.
            </div>
          )}
          {quoteResult?.error && (
            <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: '.88rem' }}>
              Error: {quoteResult.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
