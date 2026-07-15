'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Item, Modelo, Familia, Empresa } from '@/lib/types'
import QuoteModal from './QuoteModal'

interface Props { modelo: Modelo; items: Item[]; familia: Familia; empresa: Empresa; userId: string }

const fmt = (n: number) => new Intl.NumberFormat('es-AR').format(Math.round(n))

export default function Configurator({ modelo, items, familia, empresa, userId }: Props) {

  // ── Clasificar items ─────────────────────────────────────────────────────
  const fijos             = useMemo(() => items.filter(i => i.tipo === 'fijo'), [items])
  const configIncluidos   = useMemo(() => items.filter(i => i.tipo === 'configurable' && i.es_default), [items])
  const configOpcionales  = useMemo(() => items.filter(i => i.tipo === 'configurable' && !i.es_default), [items])
  const opcionales        = useMemo(() => items.filter(i => i.tipo === 'opcional'), [items])
  const ddItems           = useMemo(() => items.filter(i => i.tipo === 'dropdown'), [items])

  // Opcionales para sección: config no incluidos + tipo 'opcional'
  const addableItems      = useMemo(() => [...configOpcionales, ...opcionales], [configOpcionales, opcionales])

  // Agrupar por sección
  const secciones = useMemo(() => {
    const map = new Map<string, Item[]>()
    addableItems.forEach(it => {
      const s = (it.seccion && it.seccion.trim()) || 'OTROS'
      if (!map.has(s)) map.set(s, [])
      map.get(s)!.push(it)
    })
    return Array.from(map.entries())
  }, [addableItems])

  // Agrupar dropdowns
  const ddGroups = useMemo(() => {
    const map = new Map<string, Item[]>()
    ddItems.forEach(it => {
      const g = it.grupo_dropdown || 'Opción'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(it)
    })
    return Array.from(map.entries()).map(([label, its]) => ({ label, items: its }))
  }, [ddItems])

  // ── Estado ───────────────────────────────────────────────────────────────
  const [checkedConfig, setCheckedConfig] = useState<Set<string>>(
    () => new Set(configIncluidos.map(i => i.id))
  )
  const [ddSelected, setDdSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(ddGroups.map(g => [g.label, g.items.find(i => i.es_default)?.id ?? '']))
  )
  const [checkedAdd, setCheckedAdd] = useState<Set<string>>(new Set())
  const [descuento, setDescuento] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showSerie, setShowSerie] = useState(false)
  const [openSecs, setOpenSecs] = useState<Set<string>>(new Set())

  // ── Cálculo de precio ────────────────────────────────────────────────────
  const base = modelo.precio_lista

  // Items config default destildados → deducir
  const configDelta = configIncluidos.reduce((acc, it) => {
    if (!checkedConfig.has(it.id) && it.precio_lista > 0) acc -= it.precio_lista
    return acc
  }, 0)

  // Dropdowns: si hay item seleccionado, sumar su precio (son adiciones opcionales)
  const ddDelta = ddGroups.reduce((acc, g) => {
    const selId = ddSelected[g.label]
    if (!selId) return acc
    const sel = g.items.find(i => i.id === selId)
    if (sel) acc += sel.precio_lista
    return acc
  }, 0)

  // Opcionales agregados
  const addDelta = addableItems.reduce((acc, it) => {
    if (checkedAdd.has(it.id)) acc += it.precio_lista
    return acc
  }, 0)

  const totalConfig = base + configDelta + ddDelta + addDelta
  const descAmt = totalConfig * (descuento / 100)
  const total = totalConfig - descAmt

  // ── Modificaciones para sidebar ──────────────────────────────────────────
  const mods: { label: string; delta: number }[] = []
  configIncluidos.forEach(it => {
    if (!checkedConfig.has(it.id) && it.precio_lista > 0)
      mods.push({ label: it.descripcion, delta: -it.precio_lista })
  })
  ddGroups.forEach(g => {
    const selId = ddSelected[g.label]
    if (!selId) return
    const sel = g.items.find(i => i.id === selId)
    if (sel && sel.precio_lista > 0)
      mods.push({ label: g.label + ': ' + sel.descripcion, delta: sel.precio_lista })
  })
  addableItems.forEach(it => {
    if (checkedAdd.has(it.id) && it.precio_lista > 0)
      mods.push({ label: it.descripcion, delta: it.precio_lista })
  })

  const addedCount = addableItems.filter(i => checkedAdd.has(i.id)).length

  function toggleSec(s: string) {
    setOpenSecs(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  // Snapshot para cotización
  const itemsSnapshot = [
    ...fijos.map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: true })),
    ...configIncluidos.map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: checkedConfig.has(i.id) })),
    ...addableItems.filter(i => checkedAdd.has(i.id)).map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: true })),
  ]

  // ── Estilos ───────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #dde3f0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }
  const secHead: React.CSSProperties = { background: '#fff', borderBottom: '2px solid #003087', marginBottom: 14, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }
  const secTitle: React.CSSProperties = { fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#003087' }
  const badge: React.CSSProperties = { background: '#e8f0fb', color: '#003087', fontSize: '.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20 }
  const desc: React.CSSProperties = { fontSize: '.87rem', fontWeight: 500, lineHeight: 1.35 }
  const code: React.CSSProperties = { fontSize: '.70rem', color: '#9ca3af', marginTop: 2, fontFamily: 'monospace' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 62px)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dde3f0', padding: '14px 28px', flexShrink: 0 }}>
        <div style={{ fontSize: '.78rem', color: '#9ca3af', marginBottom: 4 }}>
          <Link href="/" style={{ color: '#003087', textDecoration: 'none' }}>Inicio</Link>{' › '}
          <Link href={`/${familia.slug}`} style={{ color: '#003087', textDecoration: 'none' }}>{familia.nombre}</Link>{' › '}
          <span>{modelo.codigo}</span>
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{modelo.nombre}</h2>
        <p style={{ fontSize: '.82rem', color: '#6b7280', margin: '2px 0 0' }}>{familia.nombre}</p>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Panel izquierdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px', minHeight: 0 }}>

          {/* ── 1. DE SERIE ─────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={secHead}>
              <span style={{ background: '#e8f5e9', color: '#2e7d32', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: '.85rem', flexShrink: 0 }}>✓</span>
              <span style={secTitle}>Equipamiento de serie</span>
              <span style={badge}>{fijos.length}</span>
              <button onClick={() => setShowSerie(v => !v)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '.78rem' }}>
                {showSerie ? 'ocultar ▲' : 'ver detalle ▼'}
              </button>
            </div>
            {showSerie && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fijos.map(it => (
                  <div key={it.id} style={{ ...card, background: '#f0faf1', borderColor: '#b7e4bc' }}>
                    <div style={{ flex: 1 }}>
                      <div style={desc}>{it.descripcion}</div>
                      <div style={code}>{it.codigo}</div>
                    </div>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontSize: '.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>de serie</span>
                  </div>
                ))}
              </div>
            )}
            {!showSerie && (
              <div style={{ fontSize: '.82rem', color: '#6b7280', paddingLeft: 4 }}>
                {fijos.slice(0, 4).map(i => i.descripcion).join(' · ')}{fijos.length > 4 ? ` · y ${fijos.length - 4} más` : ''}
              </div>
            )}
          </div>

          {/* ── 2. CONFIGURABLES INCLUIDOS ──────────────────────── */}
          {configIncluidos.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={secHead}>
                <span style={{ background: '#e8f0fb', color: '#003087', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: '.85rem', flexShrink: 0 }}>⚙</span>
                <span style={secTitle}>Configurables incluidos</span>
                <span style={badge}>{configIncluidos.length}</span>
                <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#9ca3af' }}>Destildá para quitar del precio</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {configIncluidos.map(it => (
                  <div key={it.id} style={card}>
                    <input type="checkbox" checked={checkedConfig.has(it.id)}
                      onChange={() => setCheckedConfig(prev => { const n = new Set(prev); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n })}
                      style={{ marginTop: 3, accentColor: '#003087', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, opacity: checkedConfig.has(it.id) ? 1 : 0.45 }}>
                      <div style={desc}>{it.descripcion}</div>
                      <div style={code}>{it.codigo}</div>
                    </div>
                    <div style={{ fontSize: '.75rem', color: checkedConfig.has(it.id) ? '#6b7280' : '#e5001a', whiteSpace: 'nowrap' }}>
                      {it.precio_lista > 0 ? `−USD ${fmt(it.precio_lista)} si se saca` : 'incluido'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. DROPDOWNS (tipo='dropdown') ──────────────────── */}
          {ddGroups.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={secHead}>
                <span style={{ background: '#fff3e0', color: '#e65100', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: '.85rem', flexShrink: 0 }}>☰</span>
                <span style={secTitle}>Opciones configurables</span>
                <span style={badge}>{ddGroups.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ddGroups.map(g => {
                  const selId = ddSelected[g.label]
                  const selItem = g.items.find(i => i.id === selId)
                  const defItem = g.items.find(i => i.es_default)
                  const delta = selItem ? selItem.precio_lista : 0
                  return (
                    <div key={g.label} style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 8, padding: '13px 16px' }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>{g.label}</div>
                      <select value={selId} onChange={e => setDdSelected(prev => ({ ...prev, [g.label]: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #dde3f0', borderRadius: 7, fontSize: '.87rem', background: '#f7f8fc', cursor: 'pointer' }}>
                        <option value="">— No agregar —</option>
                        {g.items.map(it => {
                          const tag = it.precio_lista > 0 ? ` (+USD ${fmt(it.precio_lista)})` : ''
                          return <option key={it.id} value={it.id}>{it.descripcion}{tag}</option>
                        })}
                      </select>
                      {selItem && <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 5, fontFamily: 'monospace' }}>{selItem.codigo}</div>}
                      {selItem && selItem.precio_lista > 0 && (
                        <div style={{ fontSize: '.78rem', marginTop: 6, fontWeight: 600, color: '#2e7d32' }}>
                          +USD {fmt(selItem.precio_lista)} agregado al precio
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 4. OPCIONALES por sección ────────────────────────── */}
          {secciones.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={secHead}>
                <span style={{ background: '#fce4ec', color: '#c62828', width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: '.85rem', flexShrink: 0 }}>＋</span>
                <span style={secTitle}>Opcionales</span>
                <span style={badge}>{addableItems.length}</span>
                <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#9ca3af' }}>Tildá los que querés agregar</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {secciones.map(([sec, its]) => (
                  <div key={sec} style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 8, overflow: 'hidden' }}>
                    <div onClick={() => toggleSec(sec)}
                      style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: '#fafbfe', userSelect: 'none' }}>
                      <span style={{ fontSize: '.82rem', fontWeight: 700, flex: 1, textTransform: 'uppercase', letterSpacing: .3 }}>{sec}</span>
                      <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>{its.length} ítems</span>
                      <span style={{ fontSize: '.7rem', color: '#9ca3af', transition: 'transform .18s', display: 'inline-block', transform: openSecs.has(sec) ? 'rotate(180deg)' : '' }}>▼</span>
                    </div>
                    {openSecs.has(sec) && (
                      <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #dde3f0' }}>
                        {/* Sub-grupos dentro de la sección */}
                        {Array.from(new Set(its.map(i => i.grupo_dropdown || ''))).map(grp => (
                          <div key={grp}>
                            {grp && <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5, margin: '8px 0 4px 2px' }}>{grp}</div>}
                            {its.filter(i => (i.grupo_dropdown || '') === grp).map(it => (
                              <div key={it.id} style={{ ...card, marginBottom: 4 }}>
                                <input type="checkbox" checked={checkedAdd.has(it.id)}
                                  onChange={() => setCheckedAdd(prev => { const n = new Set(prev); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n })}
                                  style={{ marginTop: 3, accentColor: '#003087', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={desc}>{it.descripcion}</div>
                                  <div style={code}>{it.codigo}</div>
                                </div>
                                <div style={{ fontSize: '.78rem', fontWeight: 600, color: it.precio_lista > 0 ? '#2e7d32' : '#9ca3af', whiteSpace: 'nowrap' }}>
                                  {it.precio_lista > 0 ? `+USD ${fmt(it.precio_lista)}` : 'Consultar'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        <aside style={{ width: 300, borderLeft: '1px solid #dde3f0', display: 'flex', flexDirection: 'column', background: '#fafbfe', flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

            {/* Config label */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '.68rem', letterSpacing: '.06em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Configuración</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a2e' }}>{modelo.codigo}</div>
            </div>

            {/* Rows */}
            <div style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '.82rem', color: '#6b7280' }}>Equipo base</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '.88rem' }}>USD {fmt(base)}</span>
              </div>

              {mods.map((m, i) => (
                <div key={i} style={{ padding: '9px 14px', borderBottom: '1px solid #f0f2f8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: '.75rem', color: '#6b7280', flex: 1, lineHeight: 1.3 }}>{m.label}</span>
                  <span style={{ fontSize: '.8rem', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap', color: m.delta < 0 ? '#e5001a' : '#2e7d32' }}>
                    {m.delta > 0 ? '+' : '−'}USD {fmt(Math.abs(m.delta))}
                  </span>
                </div>
              ))}

              {mods.length === 0 && (
                <div style={{ padding: '9px 14px', fontSize: '.75rem', color: '#9ca3af' }}>Configuración estándar</div>
              )}
            </div>

            {/* Descuento */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: '#6b7280', display: 'block', marginBottom: 5 }}>Descuento %</label>
              <input type="number" min={0} max={100} value={descuento || ''}
                onChange={e => setDescuento(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                placeholder="0"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #dde3f0', borderRadius: 7, fontSize: '.88rem', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Total + acciones */}
          <div style={{ padding: '16px 20px', borderTop: '2px solid #003087', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: '.78rem', color: '#6b7280', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: '.68rem', color: '#9ca3af' }}>USD FOB</span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#003087', fontFamily: 'monospace', marginBottom: 16 }}>
              {fmt(total)}
            </div>
            {addedCount > 0 && (
              <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: 12 }}>
                {addedCount} opcional{addedCount > 1 ? 'es' : ''} agregado{addedCount > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setShowModal(true)}
                style={{ background: '#003087', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                📄 Generar Cotización
              </button>
              <button onClick={() => window.print()}
                style={{ background: 'transparent', color: '#003087', border: '1px solid #003087', borderRadius: 8, padding: '9px', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' }}>
                🖨️ Imprimir
              </button>
            </div>
            <p style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 12, lineHeight: 1.5 }}>
              Precio FOB. No incluye flete, seguro ni derechos de importación.
            </p>
          </div>
        </aside>
      </div>

      {showModal && (
        <QuoteModal
          modelo={modelo} totalConfigurado={totalConfig} descuento={descuento} precioFinal={total}
          itemsSnapshot={itemsSnapshot} userId={userId} empresa={empresa} onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
