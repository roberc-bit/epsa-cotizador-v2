'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Item, Modelo, Familia, Empresa } from '@/lib/types'
import PriceSidebar from './PriceSidebar'
import QuoteModal from './QuoteModal'

interface Props {
  modelo: Modelo
  items: Item[]
  familia: Familia
  empresa: Empresa
  userId: string
}

export default function Configurator({ modelo, items, familia, empresa, userId }: Props) {
  // Separar items por tipo
  const fijos        = items.filter(i => i.tipo === 'fijo')
  const configurables = items.filter(i => i.tipo === 'configurable')
  const ddItems       = items.filter(i => i.tipo === 'dropdown')
  const opcionales    = items.filter(i => i.tipo === 'opcional')

  // Agrupar dropdowns por grupo_dropdown
  const ddGroups = useMemo(() => {
    const map = new Map<string, Item[]>()
    ddItems.forEach(it => {
      const g = it.grupo_dropdown ?? 'Sin grupo'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(it)
    })
    return Array.from(map.entries()).map(([label, its]) => ({ label, items: its }))
  }, [ddItems])

  // Agrupar opcionales por sección
  const optSections = useMemo(() => {
    const map = new Map<string, Item[]>()
    opcionales.forEach(it => {
      const s = it.seccion ?? 'OTROS'
      if (!map.has(s)) map.set(s, [])
      map.get(s)!.push(it)
    })
    return Array.from(map.entries()).map(([label, its]) => ({ label, items: its }))
  }, [opcionales])

  // Estado: configurables (tildados por default si es_default)
  const [checkedConfig, setCheckedConfig] = useState<Set<string>>(
    () => new Set(configurables.filter(i => i.es_default).map(i => i.id))
  )

  // Estado: dropdown seleccionado (default = el que tiene es_default)
  const [ddSelected, setDdSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(
      ddGroups.map(g => [g.label, g.items.find(i => i.es_default)?.id ?? g.items[0]?.id ?? ''])
    )
  )

  // Estado: opcionales
  const [checkedOpt, setCheckedOpt] = useState<Set<string>>(new Set())

  // Descuento
  const [descuento, setDescuento] = useState(0)

  // Modal
  const [showModal, setShowModal] = useState(false)

  // Secciones opcionales abiertas
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  // ── Cálculo de precio ──────────────────────────────────────
  const base = modelo.precio_lista
  const factor = modelo.factor ?? 1

  // Deltas de configurables destildados
  const configDelta = configurables.reduce((acc, it) => {
    if (!checkedConfig.has(it.id) && it.precio_lista > 0) acc -= it.precio_lista
    return acc
  }, 0)

  // Deltas de dropdowns vs default
  const ddDelta = ddGroups.reduce((acc, g) => {
    const selId = ddSelected[g.label]
    const selItem = g.items.find(i => i.id === selId)
    const defItem = g.items.find(i => i.es_default) ?? g.items[0]
    if (selItem && defItem) acc += selItem.precio_lista - defItem.precio_lista
    return acc
  }, 0)

  // Suma de opcionales
  const optDelta = opcionales.reduce((acc, it) => {
    if (checkedOpt.has(it.id)) acc += it.precio_lista
    return acc
  }, 0)

  const totalConfigurado = base + configDelta + ddDelta + optDelta
  const descuentoAmt = totalConfigurado * (descuento / 100)
  const precioFinal = totalConfigurado - descuentoAmt

  // Modificaciones para el sidebar
  const mods: { label: string; delta: number }[] = []
  configurables.forEach(it => {
    if (!checkedConfig.has(it.id) && it.precio_lista > 0)
      mods.push({ label: it.descripcion, delta: -it.precio_lista })
  })
  ddGroups.forEach(g => {
    const selId = ddSelected[g.label]
    const selItem = g.items.find(i => i.id === selId)
    const defItem = g.items.find(i => i.es_default) ?? g.items[0]
    if (selItem && defItem && selItem.id !== defItem.id) {
      const d = selItem.precio_lista - defItem.precio_lista
      if (d !== 0) mods.push({ label: g.label, delta: d })
    }
  })
  opcionales.forEach(it => {
    if (checkedOpt.has(it.id) && it.precio_lista > 0)
      mods.push({ label: it.descripcion, delta: it.precio_lista })
  })

  function toggleSection(s: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  // Snapshot para cotización
  const itemsSnapshot = [
    ...fijos.map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: true })),
    ...configurables.map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: checkedConfig.has(i.id) })),
    ...ddGroups.flatMap(g => g.items.filter(i => i.id === ddSelected[g.label]).map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo as any, precio_lista: i.precio_lista, incluido: true }))),
    ...opcionales.filter(i => checkedOpt.has(i.id)).map(i => ({ codigo: i.codigo, descripcion: i.descripcion, tipo: i.tipo, precio_lista: i.precio_lista, incluido: false })),
  ]

  const S = {
    card: { background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 } as React.CSSProperties,
    serieBadge: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', fontSize: '.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, flexShrink: 0 },
    sectionTitle: { fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#003087', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e8f0fb', display: 'flex', alignItems: 'center', gap: 8 },
    itemDesc: { fontSize: '.88rem', fontWeight: 500, lineHeight: 1.35 },
    itemCode: { fontSize: '.72rem', color: '#6b7280', marginTop: 3, fontFamily: 'monospace' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 62px)', overflow: 'hidden' }}>
      {/* Header del configurador */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dde3f0', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ fontSize: '.82rem', color: '#6b7280', marginBottom: 4 }}>
          <Link href="/" style={{ color: '#003087', textDecoration: 'none' }}>Inicio</Link>
          {' › '}
          <Link href={`/${familia.slug}`} style={{ color: '#003087', textDecoration: 'none' }}>{familia.nombre}</Link>
          {' › '}
          <span>{modelo.codigo}</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{modelo.nombre}</h2>
        <p style={{ fontSize: '.85rem', color: '#6b7280' }}>{familia.nombre}</p>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Panel principal (scroll independiente) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minHeight: 0 }}>

          {/* 1. DE SERIE */}
          <div style={{ marginBottom: 24 }}>
            <div style={S.sectionTitle}>
              DE SERIE
              <span style={{ background: '#e8f0fb', color: '#003087', fontSize: '.7rem', padding: '1px 7px', borderRadius: 20 }}>{fijos.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fijos.map(it => (
                <div key={it.id} style={{ ...S.card, background: '#e8f5e9', borderColor: '#a5d6a7' }}>
                  <div style={{ flex: 1 }}>
                    <div style={S.itemDesc}>{it.descripcion}</div>
                    <div style={S.itemCode}>{it.codigo}</div>
                  </div>
                  <span style={S.serieBadge}>De Serie</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CONFIGURABLES DE SERIE */}
          {configurables.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={S.sectionTitle}>
                CONFIGURABLES INCLUIDOS
                <span style={{ background: '#e8f0fb', color: '#003087', fontSize: '.7rem', padding: '1px 7px', borderRadius: 20 }}>{configurables.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {configurables.map(it => (
                  <div key={it.id} style={S.card}>
                    <input type="checkbox" checked={checkedConfig.has(it.id)}
                      onChange={() => setCheckedConfig(prev => {
                        const next = new Set(prev)
                        next.has(it.id) ? next.delete(it.id) : next.add(it.id)
                        return next
                      })}
                      style={{ marginTop: 2, accentColor: '#003087', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={S.itemDesc}>{it.descripcion}</div>
                      <div style={S.itemCode}>{it.codigo}</div>
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#6b7280' }}>
                      {it.precio_lista > 0 ? `−${new Intl.NumberFormat('es-AR').format(it.precio_lista)} si se saca` : 'Incluido'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. DROPDOWNS */}
          {ddGroups.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={S.sectionTitle}>
                OPCIONES CONFIGURABLES
                <span style={{ background: '#e8f0fb', color: '#003087', fontSize: '.7rem', padding: '1px 7px', borderRadius: 20 }}>{ddGroups.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ddGroups.map(g => {
                  const selId = ddSelected[g.label]
                  const selItem = g.items.find(i => i.id === selId)
                  const defItem = g.items.find(i => i.es_default) ?? g.items[0]
                  const delta = selItem && defItem ? selItem.precio_lista - defItem.precio_lista : 0
                  return (
                    <div key={g.label} style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#003087', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>{g.label}</div>
                      <select
                        value={selId}
                        onChange={e => setDdSelected(prev => ({ ...prev, [g.label]: e.target.value }))}
                        style={{ width: '100%', padding: '9px 32px 9px 12px', border: '1px solid #dde3f0', borderRadius: 8, fontSize: '.88rem', background: '#f4f6fa', cursor: 'pointer', appearance: 'none' }}
                      >
                        {g.items.map(it => (
                          <option key={it.id} value={it.id}>{it.descripcion}</option>
                        ))}
                      </select>
                      {/* Códigos del item seleccionado */}
                      <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {selItem && (
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 600, background: '#e8f0fb', color: '#003087', border: '1px solid #90caf9', padding: '2px 8px', borderRadius: 4 }}>
                            {selItem.codigo}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 6 }}>
                        {delta === 0
                          ? 'Incluido en precio de lista'
                          : <span>Diferencia: <span style={{ fontWeight: 600, color: delta > 0 ? '#2e7d32' : '#e5001a' }}>{delta > 0 ? '+' : ''}USD {new Intl.NumberFormat('es-AR').format(Math.abs(delta))}</span></span>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. OPCIONALES */}
          {optSections.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={S.sectionTitle}>
                OPCIONALES
                <span style={{ background: '#e8f0fb', color: '#003087', fontSize: '.7rem', padding: '1px 7px', borderRadius: 20 }}>{opcionales.length}</span>
              </div>
              {optSections.map(sec => (
                <div key={sec.label} style={{ background: '#fff', border: '1px solid #dde3f0', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                  <div
                    onClick={() => toggleSection(sec.label)}
                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: '#fafbfe', userSelect: 'none' }}
                  >
                    <span style={{ fontSize: '.83rem', fontWeight: 600, flex: 1 }}>{sec.label}</span>
                    <span style={{ fontSize: '.75rem', color: '#6b7280' }}>{sec.items.length} ítems</span>
                    <span style={{ fontSize: '.7rem', color: '#6b7280', transition: 'transform .2s', transform: openSections.has(sec.label) ? 'rotate(180deg)' : '' }}>▼</span>
                  </div>
                  {openSections.has(sec.label) && (
                    <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #dde3f0' }}>
                      {sec.items.map(it => (
                        <div key={it.id} style={S.card}>
                          <input type="checkbox" checked={checkedOpt.has(it.id)}
                            onChange={() => setCheckedOpt(prev => {
                              const next = new Set(prev)
                              next.has(it.id) ? next.delete(it.id) : next.add(it.id)
                              return next
                            })}
                            style={{ marginTop: 2, accentColor: '#003087', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={S.itemDesc}>{it.descripcion}</div>
                            <div style={S.itemCode}>{it.codigo}</div>
                          </div>
                          <div style={{ fontSize: '.85rem', fontWeight: 600, color: it.precio_lista > 0 ? '#003087' : '#6b7280', whiteSpace: 'nowrap' }}>
                            {it.precio_lista > 0 ? `+USD ${new Intl.NumberFormat('es-AR').format(it.precio_lista)}` : 'Consultar'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar fijo */}
        <PriceSidebar
          base={base}
          mods={mods}
          totalConfigurado={totalConfigurado}
          descuento={descuento}
          onDescuentoChange={setDescuento}
          onGenerarCotizacion={() => setShowModal(true)}
        />
      </div>

      {/* Modal de cotización */}
      {showModal && (
        <QuoteModal
          modelo={modelo}
          totalConfigurado={totalConfigurado}
          descuento={descuento}
          precioFinal={precioFinal}
          itemsSnapshot={itemsSnapshot}
          userId={userId}
          empresa={empresa}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
