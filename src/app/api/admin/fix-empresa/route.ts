import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('empresa').update({
    pie_cotizacion: 'Precios en USD. No incluye flete, seguro ni derechos de importación. Validez sujeta a disponibilidad de stock. Cotización generada por Escandinavia del Plata S.A.',
  }).eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
