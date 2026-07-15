import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const db = createAdminSupabase()

  // Ver sample de items para entender la estructura actual
  const { data } = await db
    .from('items')
    .select('tipo, es_default, grupo_dropdown, seccion, descripcion, codigo')
    .order('seccion', { ascending: true })
    .limit(50)

  // Contar por tipo
  const { data: tipos } = await db.rpc('get_item_type_counts' as never).select('*') as { data: null }

  // Alternativa: agrupamos manualmente
  const byTipo: Record<string, number> = {}
  const bySec: Record<string, number> = {}
  data?.forEach(i => {
    byTipo[i.tipo || 'null'] = (byTipo[i.tipo || 'null'] || 0) + 1
    bySec[(i.seccion || 'null') + '|' + i.es_default] = ((bySec[(i.seccion || 'null') + '|' + i.es_default]) || 0) + 1
  })

  return NextResponse.json({ sample: data?.slice(0, 10), byTipo, bySec, total: data?.length })
}

export async function POST() {
  const db = createAdminSupabase()
  return NextResponse.json({ msg: 'POST ready' })
}
