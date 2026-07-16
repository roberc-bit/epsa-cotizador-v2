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

export default function Configurator({ modelo, items, familia, empresa, userId }: ConfiguratorProps) {

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

  const allSec3Sections = useMemo(() => {
    const secs = new Set<string>()
    sec3Dropdowns.forEach(([, its]) => its.forEach(i => i.seccion && secs.add(i.seccion)))
    sec3Checks.forEach(i => i.seccion && secs.add(i.seccion))
    return [...secs]
  }, [sec3Dropdowns, sec3Checks])

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

  // ── UI State ──────────────────────────────────────────────────────
  const [sec1Open, setSec1Open] = useState(false)
  const [sec2Open, setSec2Open] = useState(false)
  const [sec3Open, setSec3Open] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

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

  // Quote modal
  const [showQuote, setShowQuote] = useState(false)
  const [descuentoPct, setDescuentoPct] = useState(0)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [quoteResult, setQuoteResult] = useState<{ success?: boolean; numero?: number; error?: string } | null>(null)

  // ── Pricing ────────────────────────────────────────────────────────
  const adjustments = useMemo(() => {
    const list: { label: string; delta: number }[] = []
    sec2Dropdowns.forEach(g => {
      const sel = g.items.find(i => i.codigo === ddSel[g.label])
      if (sel && g.defaultItem) {
        const d = sel.precio_lista - g.defaultItem.precio_lista
        if (d !== 0) list.push({ label: sel.descripcion, delta: d })
      }
    })
    sec2Checks.forEach(i => {
      if (!checkSel[i.codigo]) list.push({ label: i.descripcion, delta: -i.precio_lista })
    })
    sec3Dropdowns.forEach(([, its]) => {
      const sel = its.find(i => i.codigo === ddSel[its[0]?.grupo_dropdown ?? ''])
      if (sel) list.push({ label: sel.descripcion, delta: sel.precio_lista })
    })
    // fix sec3 dropdowns label lookup
    return list
  }, [sec2Dropdowns, sec2Checks, sec3Dropdowns, ddSel, checkSel])

  const { total, precioFinal, totalAdjustments } = useMemo(() => {
    const base = modelo.precio_lista
    let adj = 0
    sec2Dropdowns.forEach(g => {
      const sel = g.items.find(i => i.codigo === ddSel[g.label])
      if (sel && g.defaultItem) adj += sel.precio_lista - g.defaultItem.precio_lista
    })
    sec2Checks.forEach(i => { if (!checkSel[i.codigo]) adj -= i.precio_lista })
    sec3Dropdowns.forEach(([label, its]) => {
      const sel = its.find(i => i.codigo === ddSel[label])
      if (sel) adj += sel.precio_lista
    })
    sec3Checks.forEach(i => { if (checkSel[i.codigo]) adj += i.precio_lista })
    const t = base + adj
    return { total: t, precioFinal: descuentoPct > 0 ? t * (1 - descuentoPct / 100) : t, totalAdjustments: adj }
  }, [modelo.precio_lista, sec2Dropdowns, sec3Dropdowns, sec2Checks, sec3Checks, ddSel, checkSel, descuentoPct])

  function reset() {
    setDdSel(initDdSel)
    setCheckSel(initCheckSel)
    setDescuentoPct(0)
    setQuoteResult(null)
  }

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
        body: JSON.stringify({ emailCliente: clienteEmail, nombreCliente: clienteNombre, emailVendedor: empresa?.email ?? null, modeloNombre: modelo.nombre, modeloCodigo: modelo.codigo, itemsJson, precioBase: modelo.precio_lista, precioTotal: total, descuentoPct, precioFinal, userId, modeloId: modelo.id }),
      })
      const data = await res.json()
      setQuoteResult(data.success ? { success: true, numero: data.numero } : { error: data.error ?? 'Error' })
    } catch (e: any) { setQuoteResult({ error: e.message }) }
    finally { setSending(false) }
  }

  const sec2Count = sec2Dropdowns.length + sec2Checks.length
  const sec3Count = [...sec3BySec.values()].reduce((a, v) => a + v.dropdowns.length + v.checks.length, 0)

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #dde3f0', borderRadius: 6, fontSize: '.88rem', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: '#6b7280', display: 'block', marginBottom: 5 }

  return (
    <div>
      {/* PAGE HERO */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003087 100%)', color: '#fff', padding: '20px 32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>
            Equipos &rsaquo; {familia.nombre} &rsaquo; <strong style={{ color: 'rgba(255,255,255,.85)' }}>{modelo.nombre}</strong>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{modelo.nombre}</h1>
          <p style={{ opacity: .6, margin: '6px 0 0', fontSize: '.88rem' }}>Configurá el equipo y generá tu cotización personalizada</p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* LEFT — ACCORDIONS */}
        <div>

          {/* SECTION 1 — EQUIPAMIENTO DE SERIE */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setSec1Open(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '.85rem', letterSpacing: .8, color: '#1a1a2e', textTransform: 'uppercase' }}>Equipamiento de Serie</span>
                <span style={{ background: '#f59e0b', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{fijos.length} ÍTEMS</span>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>{sec1Open ? '▲' : '▼'}</span>
            </button>
            {!sec1Open && (
              <div style={{ padding: '0 20px 14px', fontSize: '.82rem', color: '#9ca3af' }}>
                {fijos.map(i => i.descripcion).join(' · ')}
              </div>
            )}
            {sec1Open && (
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                {fijos.map((item, i) => (
                  <div key={item.codigo} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < fijos.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ fontSize: '.87rem', color: '#374151', flex: 1 }}>{item.descripcion}</span>
                    <span style={{ fontSize: '.72rem', color: '#d1d5db', fontFamily: 'monospace' }}>{item.codigo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2 — CONFIGURACIÓN INCLUIDA */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setSec2Open(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '.85rem', letterSpacing: .8, color: '#1a1a2e', textTransform: 'uppercase' }}>Configuración Incluida</span>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{sec2Count} ÍTEMS</span>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>{sec2Open ? '▲' : '▼'}</span>
            </button>
            {sec2Open && (
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                {sec2Dropdowns.map((group) => {
                  const selCode = ddSel[group.label]
                  const selItem = group.items.find(it => it.codigo === selCode) ?? group.defaultItem
                  const delta = selItem && group.defaultItem ? selItem.precio_lista - group.defaultItem.precio_lista : 0
                  return (
                    <div key={group.label} style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                      <label style={labelStyle}>{group.label}</label>
                      <select value={selCode ?? ''} onChange={e => setDdSel(p => ({ ...p, [group.label]: e.target.value || null }))} style={inputStyle}>
                        {group.items.map(it => {
                          const d = it.precio_lista - (group.defaultItem?.precio_lista ?? 0)
                          const suffix = it.es_default ? ' (incluido)' : d !== 0 ? ` (${d > 0 ? '+' : ''}${fmt(d)})` : ''
                          return <option key={it.codigo} value={it.codigo}>{it.descripcion}{suffix}</option>
                        })}
                      </select>
                      {delta !== 0 && <div style={{ fontSize: '.78rem', fontWeight: 700, color: delta > 0 ? '#dc2626' : '#16a34a', marginTop: 4 }}>{delta > 0 ? '+' : ''}{fmt(delta)}</div>}
                    </div>
                  )
                })}
                {sec2Checks.map((item) => (
                  <label key={item.codigo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', background: checkSel[item.codigo] === false ? '#fef2f2' : 'transparent' }}>
                    <input type="checkbox" checked={checkSel[item.codigo] ?? true} onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#003087', flexShrink: 0 }} />
                    <span style={{ fontSize: '.87rem', color: checkSel[item.codigo] === false ? '#9ca3af' : '#374151', flex: 1, textDecoration: checkSel[item.codigo] === false ? 'line-through' : 'none' }}>
                      {item.descripcion}
                    </span>
                    {checkSel[item.codigo] === false && <span style={{ fontSize: '.78rem', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(-item.precio_lista)}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3 — OPCIONALES */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <button
              onClick={() => setSec3Open(p => !p)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '.85rem', letterSpacing: .8, color: '#1a1a2e', textTransform: 'uppercase' }}>Opcionales Adicionales</span>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{sec3Count} DISPONIBLES</span>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>{sec3Open ? '▲' : '▼'}</span>
            </button>
            {sec3Open && (
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                {allSec3Sections.map(sec => {
                  const { dropdowns, checks } = sec3BySec.get(sec) ?? { dropdowns: [], checks: [] }
                  const isOpen = openSections[sec] ?? false
                  return (
                    <div key={sec} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => setOpenSections(p => ({ ...p, [sec]: !p[sec] }))}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', background: '#f9fafb', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>{sec}</span>
                        <span style={{ color: '#9ca3af', fontSize: '.72rem' }}>{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <div>
                          {dropdowns.map(([label, its]) => (
                            <div key={label} style={{ padding: '12px 20px', borderTop: '1px solid #f9fafb' }}>
                              <label style={labelStyle}>{label}</label>
                              <select value={ddSel[label] ?? ''} onChange={e => setDdSel(p => ({ ...p, [label]: e.target.value || null }))} style={inputStyle}>
                                <option value="">No agregar</option>
                                {its.map(it => <option key={it.codigo} value={it.codigo}>{it.descripcion} — {fmt(it.precio_lista)}</option>)}
                              </select>
                            </div>
                          ))}
                          {checks.map(item => (
                            <label key={item.codigo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', borderTop: '1px solid #f9fafb', background: checkSel[item.codigo] ? '#f0fdf4' : 'transparent' }}>
                              <input type="checkbox" checked={checkSel[item.codigo] ?? false} onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#003087', flexShrink: 0 }} />
                              <span style={{ fontSize: '.87rem', color: '#374151', flex: 1 }}>{item.descripcion}</span>
                              <span style={{ fontSize: '.78rem', fontWeight: 700, color: checkSel[item.codigo] ? '#dc2626' : '#d1d5db', whiteSpace: 'nowrap' }}>
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
        </div>

        {/* RIGHT — STICKY SIDEBAR */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>Resumen de precio</h3>
            <div style={{ height: 3, width: 40, background: '#f59e0b', borderRadius: 2, marginBottom: 18 }} />

            {/* PRECIO BASE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, color: '#9ca3af', marginBottom: 8 }}>Precio Base</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.85rem', color: '#374151' }}>{modelo.codigo} — Precio de lista</span>
                <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#1a1a2e' }}>{fmt(modelo.precio_lista)}</span>
              </div>
            </div>

            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 16 }} />

            {/* AJUSTES */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, color: '#9ca3af', marginBottom: 8 }}>Ajustes de Configuración</div>
              {totalAdjustments === 0 ? (
                <div style={{ fontSize: '.83rem', color: '#d1d5db', fontStyle: 'italic' }}>Sin modificaciones</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Sec2 dropdown deltas */}
                  {sec2Dropdowns.map(g => {
                    const sel = g.items.find(i => i.codigo === ddSel[g.label])
                    if (!sel || !g.defaultItem) return null
                    const d = sel.precio_lista - g.defaultItem.precio_lista
                    if (d === 0) return null
                    return (
                      <div key={g.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                        <span style={{ color: '#6b7280', flex: 1, marginRight: 8 }}>{g.label}: {sel.descripcion}</span>
                        <span style={{ fontWeight: 600, color: d > 0 ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}>{d > 0 ? '+' : ''}{fmt(d)}</span>
                      </div>
                    )
                  })}
                  {/* Sec2 unchecked */}
                  {sec2Checks.filter(i => !checkSel[i.codigo]).map(i => (
                    <div key={i.codigo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span style={{ color: '#6b7280', flex: 1, marginRight: 8, textDecoration: 'line-through' }}>{i.descripcion}</span>
                      <span style={{ fontWeight: 600, color: '#16a34a', whiteSpace: 'nowrap' }}>{fmt(-i.precio_lista)}</span>
                    </div>
                  ))}
                  {/* Sec3 dropdowns selected */}
                  {sec3Dropdowns.map(([label, its]) => {
                    const sel = its.find(i => i.codigo === ddSel[label])
                    if (!sel) return null
                    return (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                        <span style={{ color: '#6b7280', flex: 1, marginRight: 8 }}>{sel.descripcion}</span>
                        <span style={{ fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>+{fmt(sel.precio_lista)}</span>
                      </div>
                    )
                  })}
                  {/* Sec3 checkboxes checked */}
                  {sec3Checks.filter(i => checkSel[i.codigo]).map(i => (
                    <div key={i.codigo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span style={{ color: '#6b7280', flex: 1, marginRight: 8 }}>{i.descripcion}</span>
                      <span style={{ fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>+{fmt(i.precio_lista)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 16 }} />

            {/* DESCUENTO */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '.78rem', color: '#6b7280', display: 'block', marginBottom: 6 }}>Descuento (%)</label>
              <input type="number" min={0} max={50} value={descuentoPct} onChange={e => setDescuentoPct(Number(e.target.value))}
                style={{ ...inputStyle, width: '100%' }} />
            </div>

            <div style={{ height: 1, background: '#e5e7eb', marginBottom: 16 }} />

            {/* TOTAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: '#374151' }}>Total</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#003087' }}>{fmt(precioFinal)}</span>
            </div>

            {/* BUTTONS */}
            <button onClick={() => setShowQuote(true)}
              style={{ width: '100%', background: '#f59e0b', color: '#1a1a2e', border: 'none', padding: '13px', borderRadius: 8, fontWeight: 700, fontSize: '.95rem', cursor: 'pointer', marginBottom: 8 }}>
              Generar cotización →
            </button>
            <button onClick={reset}
              style={{ width: '100%', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', padding: '10px', borderRadius: 8, fontSize: '.85rem', cursor: 'pointer' }}>
              ↺ Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* QUOTE MODAL */}
      {showQuote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Generar Cotización</h3>
              <button onClick={() => { setShowQuote(false); setQuoteResult(null) }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            {quoteResult?.success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>Cotización #{String(quoteResult.numero).padStart(5, '0')} enviada</p>
                <p style={{ color: '#6b7280', fontSize: '.88rem' }}>El cliente recibirá el email con el detalle.</p>
                <button onClick={() => { setShowQuote(false); setQuoteResult(null) }} style={{ marginTop: 16, background: '#003087', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nombre del cliente</label>
                  <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Empresa / Persona" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email del cliente</label>
                  <input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} placeholder="cliente@empresa.com" style={inputStyle} />
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: '.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#6b7280' }}>Precio configurado</span>
                    <span style={{ fontWeight: 600 }}>{fmt(total)}</span>
                  </div>
                  {descuentoPct > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Con {descuentoPct}% descuento</span>
                      <span style={{ fontWeight: 700, color: '#003087' }}>{fmt(precioFinal)}</span>
                    </div>
                  )}
                </div>
                {quoteResult?.error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '8px 12px', fontSize: '.85rem', marginBottom: 12 }}>
                    {quoteResult.error}
                  </div>
                )}
                <button onClick={handleSendQuote} disabled={sending || !clienteNombre || !clienteEmail}
                  style={{ width: '100%', background: sending || !clienteNombre || !clienteEmail ? '#d1d5db' : '#f59e0b', color: '#1a1a2e', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: '.95rem', cursor: sending || !clienteNombre || !clienteEmail ? 'not-allowed' : 'pointer' }}>
                  {sending ? 'Enviando…' : 'Enviar cotización por email'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
