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

interface DropdownGroup {
  label: string
  items: Item[]
  defaultItem: Item | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null
  const pos = delta > 0
  return (
    <span className={`text-xs font-semibold ml-1 ${pos ? 'text-red-500' : 'text-green-600'}`}>
      ({pos ? '+' : ''}{fmt(delta)})
    </span>
  )
}

export default function Configurator({ modelo, items, empresa, userId }: ConfiguratorProps) {

  // ── Classify ──────────────────────────────────────────────────────
  const fijos = useMemo(() => items.filter(i => i.tipo === 'fijo').sort((a, b) => a.orden - b.orden), [items])

  const ddGroupMap = useMemo(() => {
    const map = new Map<string, Item[]>()
    items.filter(i => i.tipo === 'dropdown').forEach(i => {
      const k = i.grupo_dropdown ?? 'Opción'
      const arr = map.get(k) ?? []
      arr.push(i)
      map.set(k, arr)
    })
    map.forEach((arr, k) => map.set(k, arr.sort((a, b) => a.orden - b.orden)))
    return map
  }, [items])

  const sec2Dropdowns = useMemo((): DropdownGroup[] =>
    [...ddGroupMap.entries()]
      .filter(([, its]) => its.some(i => i.es_default))
      .map(([label, its]) => ({ label, items: its, defaultItem: its.find(i => i.es_default) ?? null })),
    [ddGroupMap])

  const sec3Dropdowns = useMemo(() =>
    [...ddGroupMap.entries()].filter(([, its]) => !its.some(i => i.es_default)),
    [ddGroupMap])

  const sec2Checks = useMemo(() =>
    items.filter(i => i.tipo === 'configurable' && i.es_default).sort((a, b) => a.orden - b.orden),
    [items])

  const sec3Checks = useMemo(() =>
    items.filter(i => (i.tipo === 'configurable' || i.tipo === 'opcional') && !i.es_default).sort((a, b) => a.orden - b.orden),
    [items])

  // ── UI State ──────────────────────────────────────────────────────
  const [sec1Open, setSec1Open] = useState(false)
  const [sec2Open, setSec2Open] = useState(true)
  const [sec3Open, setSec3Open] = useState(true)

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
  const toggleSection = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s] }))

  // Quote form state
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
    const pf = descuentoPct > 0 ? t * (1 - descuentoPct / 100) : t
    return { total: t, precioFinal: pf }
  }, [modelo.precio_lista, sec2Dropdowns, sec3Dropdowns, sec2Checks, sec3Checks, ddSel, checkSel, descuentoPct])

  // ── Sec3 grouping ──────────────────────────────────────────────────
  const sec3BySec = useMemo(() => {
    const map = new Map<string, { dropdowns: [string, Item[]][]; checks: Item[] }>()
    allSec3Sections.forEach(s => map.set(s, { dropdowns: [], checks: [] }))
    sec3Dropdowns.forEach(([label, its]) => {
      const s = its[0]?.seccion ?? 'Otros'
      const e = map.get(s) ?? { dropdowns: [], checks: [] }
      e.dropdowns.push([label, its])
      map.set(s, e)
    })
    sec3Checks.forEach(i => {
      const s = i.seccion ?? 'Otros'
      const e = map.get(s) ?? { dropdowns: [], checks: [] }
      e.checks.push(i)
      map.set(s, e)
    })
    return map
  }, [allSec3Sections, sec3Dropdowns, sec3Checks])

  // ── Quote send ─────────────────────────────────────────────────────
  async function handleSendQuote() {
    if (!clienteNombre || !clienteEmail) return
    setSending(true)
    setQuoteResult(null)
    try {
      // Build items_json
      const itemsJson: any[] = []
      fijos.forEach(i => itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'fijo', precio_lista: i.precio_lista, incluido: true }))
      sec2Dropdowns.forEach(g => {
        const sel = g.items.find(i => i.codigo === ddSel[g.label]) ?? g.defaultItem
        if (sel) itemsJson.push({ codigo: sel.codigo, descripcion: sel.descripcion, tipo: 'dropdown', precio_lista: sel.precio_lista - (g.defaultItem?.precio_lista ?? 0), incluido: true })
      })
      sec2Checks.forEach(i => {
        itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'configurable', precio_lista: i.precio_lista, incluido: checkSel[i.codigo] ?? true })
      })
      sec3Dropdowns.forEach(([label, its]) => {
        const sel = its.find(i => i.codigo === ddSel[label])
        if (sel) itemsJson.push({ codigo: sel.codigo, descripcion: sel.descripcion, tipo: 'dropdown', precio_lista: sel.precio_lista, incluido: false })
      })
      sec3Checks.forEach(i => {
        if (checkSel[i.codigo]) itemsJson.push({ codigo: i.codigo, descripcion: i.descripcion, tipo: 'opcional', precio_lista: i.precio_lista, incluido: false })
      })

      const res = await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailCliente: clienteEmail,
          nombreCliente: clienteNombre,
          emailVendedor: empresa?.email ?? null,
          modeloNombre: modelo.nombre,
          modeloCodigo: modelo.codigo,
          itemsJson,
          precioBase: modelo.precio_lista,
          precioTotal: total,
          descuentoPct,
          precioFinal,
          userId,
          modeloId: modelo.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQuoteResult({ success: true, numero: data.numero })
      } else {
        setQuoteResult({ error: data.error ?? 'Error al enviar' })
      }
    } catch (e: any) {
      setQuoteResult({ error: e.message })
    } finally {
      setSending(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  const sec2ItemCount = sec2Dropdowns.length + sec2Checks.length
  const sec3ItemCount = [...sec3BySec.values()].reduce((a, v) => a + v.dropdowns.length + v.checks.length, 0)

  function SectionHeader({ title, count, open, onToggle }: { title: string; count?: number; open: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{count} ítems</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* MODELO HEADER */}
      <div className="flex items-center gap-4 mb-2">
        {modelo.imagen_url && (
          <img src={modelo.imagen_url} alt={modelo.nombre} className="h-16 w-24 object-cover rounded-lg" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{modelo.codigo}</h1>
          <p className="text-gray-500 text-sm">{modelo.nombre}</p>
        </div>
      </div>

      {/* PRICE DISPLAY */}
      <div className="bg-[#003057] text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="text-xs text-blue-200 uppercase tracking-wider">Precio configurado</p>
          <p className="text-3xl font-bold mt-0.5">{fmt(total)}</p>
          {descuentoPct > 0 && (
            <p className="text-sm text-green-300 mt-1">Con {descuentoPct}% descuento: <strong>{fmt(precioFinal)}</strong></p>
          )}
        </div>
        <div className="text-sm text-blue-200 text-right">
          <p>Precio de lista base</p>
          <p className="text-white font-semibold text-lg">{fmt(modelo.precio_lista)}</p>
        </div>
      </div>

      {/* SECTION 1 — DE SERIE NO CONFIGURABLE */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          title="Equipamiento de serie no configurable"
          count={fijos.length}
          open={sec1Open}
          onToggle={() => setSec1Open(p => !p)}
        />
        {sec1Open && (
          <ul className="divide-y divide-gray-100">
            {fijos.map(item => (
              <li key={item.codigo} className="px-4 py-2.5 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{item.descripcion}</span>
                <span className="text-xs text-gray-400 font-mono">{item.codigo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SECTION 2 — DE SERIE CONFIGURABLE */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          title="Equipamiento de serie configurable"
          count={sec2ItemCount}
          open={sec2Open}
          onToggle={() => setSec2Open(p => !p)}
        />
        {sec2Open && (
          <div className="divide-y divide-gray-100">
            {sec2Dropdowns.map(group => {
              const selCode = ddSel[group.label]
              const selItem = group.items.find(i => i.codigo === selCode) ?? group.defaultItem
              const delta = selItem && group.defaultItem ? selItem.precio_lista - group.defaultItem.precio_lista : 0
              return (
                <div key={group.label} className="px-4 py-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{group.label}</label>
                  <select
                    value={selCode ?? ''}
                    onChange={e => setDdSel(p => ({ ...p, [group.label]: e.target.value || null }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003057]"
                  >
                    {group.items.map(it => {
                      const d = it.precio_lista - (group.defaultItem?.precio_lista ?? 0)
                      const suffix = it.es_default ? ' (incluido)' : d !== 0 ? ` (${d > 0 ? '+' : ''}${fmt(d)})` : ''
                      return <option key={it.codigo} value={it.codigo}>{it.descripcion}{suffix}</option>
                    })}
                  </select>
                  {delta !== 0 && <DeltaBadge delta={delta} />}
                </div>
              )
            })}
            {sec2Checks.map(item => (
              <label key={item.codigo} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={checkSel[item.codigo] ?? true}
                  onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))}
                  className="w-4 h-4 accent-[#003057]"
                />
                <span className={`text-sm flex-1 ${checkSel[item.codigo] === false ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.descripcion}
                </span>
                {checkSel[item.codigo] === false && (
                  <span className="text-xs text-green-600 font-semibold">{fmt(-item.precio_lista)}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3 — OPCIONALES */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <SectionHeader
          title="Opcionales adicionales"
          count={sec3ItemCount}
          open={sec3Open}
          onToggle={() => setSec3Open(p => !p)}
        />
        {sec3Open && (
          <div className="divide-y divide-gray-200">
            {allSec3Sections.map(sec => {
              const { dropdowns, checks } = sec3BySec.get(sec) ?? { dropdowns: [], checks: [] }
              const isOpen = openSections[sec] ?? false
              return (
                <div key={sec}>
                  <button
                    onClick={() => toggleSection(sec)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-700">{sec}</span>
                    <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gray-100">
                      {dropdowns.map(([label, its]) => (
                        <div key={label} className="px-4 py-3">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
                          <select
                            value={ddSel[label] ?? ''}
                            onChange={e => setDdSel(p => ({ ...p, [label]: e.target.value || null }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003057]"
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
                      {checks.map(item => (
                        <label key={item.codigo} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checkSel[item.codigo] ?? false}
                            onChange={e => setCheckSel(p => ({ ...p, [item.codigo]: e.target.checked }))}
                            className="w-4 h-4 accent-[#003057]"
                          />
                          <span className="text-sm text-gray-700 flex-1">{item.descripcion}</span>
                          <span className={`text-xs font-semibold ${checkSel[item.codigo] ? 'text-red-500' : 'text-gray-400'}`}>
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
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Generar Cotización</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del cliente</label>
              <input
                type="text"
                value={clienteNombre}
                onChange={e => setClienteNombre(e.target.value)}
                placeholder="Empresa / Persona"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003057]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email del cliente</label>
              <input
                type="email"
                value={clienteEmail}
                onChange={e => setClienteEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003057]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Descuento (%)</label>
            <input
              type="number"
              min={0}
              max={50}
              value={descuentoPct}
              onChange={e => setDescuentoPct(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003057]"
            />
            {descuentoPct > 0 && (
              <span className="text-sm text-green-600 font-semibold">→ Total: {fmt(precioFinal)}</span>
            )}
          </div>
          <button
            onClick={handleSendQuote}
            disabled={sending || !clienteNombre || !clienteEmail}
            className="w-full bg-[#003057] hover:bg-[#00224a] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            {sending ? 'Enviando...' : 'Enviar Cotización por Email'}
          </button>
          {quoteResult?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              ✓ Cotización #{String(quoteResult.numero).padStart(5, '0')} enviada correctamente.
            </div>
          )}
          {quoteResult?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              Error: {quoteResult.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
