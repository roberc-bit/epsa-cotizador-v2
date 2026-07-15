export type Rol = 'admin' | 'vendedor'

export interface Empresa {
  id: number
  nombre: string
  validez: string
  tipo_cambio: number
  email: string | null
  telefono: string | null
  pie_cotizacion: string | null
}

export interface Familia {
  id: string
  slug: string
  nombre: string
  orden: number
  imagen_url: string | null
  activo: boolean
}

export interface Modelo {
  id: string
  familia_id: string
  codigo: string
  nombre: string
  descripcion: string | null
  precio_fob: number | null
  precio_lista: number
  factor: number | null
  imagen_url: string | null
  activo: boolean
}

export type TipoItem = 'fijo' | 'configurable' | 'dropdown' | 'opcional'

export interface Item {
  id: string
  modelo_id: string
  tipo: TipoItem
  grupo_dropdown: string | null
  es_default: boolean
  seccion: string | null
  codigo: string
  descripcion: string
  precio_fob: number
  precio_lista: number
  orden: number
  activo: boolean
}

export interface Perfil {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  created_at: string
}

export interface ItemCotizado {
  codigo: string
  descripcion: string
  tipo: TipoItem
  precio_lista: number
  incluido: boolean // true = viene en precio base
}

export interface Cotizacion {
  id: string
  numero: number
  usuario_id: string
  modelo_id: string
  cliente_nombre: string | null
  cliente_email: string | null
  items_json: ItemCotizado[]
  precio_base: number
  precio_total: number
  descuento_pct: number
  precio_final: number
  email_enviado: boolean
  created_at: string
  // joins
  perfil?: Perfil
  modelo?: Modelo
}

export interface Actividad {
  id: string
  usuario_id: string
  tipo: 'login' | 'logout' | 'modelo_visto' | 'cotizacion' | 'lista_precios'
  detalle: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  perfil?: Perfil
}

// ── Configurator state ────────────────────────────────────────
export interface DropdownGroup {
  label: string
  items: Item[]
  selectedId: string
}

export interface ConfigState {
  modelo: Modelo
  fijos: Item[]
  configurables: Item[]       // checked = incluido
  dropdowns: DropdownGroup[]
  opcionales: { seccion: string; items: Item[] }[]
  checkedConfigIds: Set<string>
  checkedOptIds: Set<string>
  descuentoPct: number
}
