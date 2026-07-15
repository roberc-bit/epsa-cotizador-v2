import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const db = createAdminSupabase()

  // 1. Ver cuántos items tienen grupo_dropdown no vacío
  const { data: preview } = await db
    .from('items')
    .select('tipo, grupo_dropdown, es_default, descripcion, seccion')
    .not('grupo_dropdown', 'is', null)
    .neq('grupo_dropdown', '')
    .order('grupo_dropdown')
    .limit(30)

  // 2. Contar por grupo
  const { data: count } = await db
    .from('items')
    .select('grupo_dropdown', { count: 'exact' })
    .not('grupo_dropdown', 'is', null)
    .neq('grupo_dropdown', '')

  return NextResponse.json({ preview, totalWithGroup: count?.length })
}

export async function POST() {
  const db = createAdminSupabase()

  // Cambiar tipo a 'dropdown' para todos los items con grupo_dropdown no vacío
  const { data, error } = await db
    .from('items')
    .update({ tipo: 'dropdown' })
    .not('grupo_dropdown', 'is', null)
    .neq('grupo_dropdown', '')
    .select('id, descripcion, grupo_dropdown, es_default')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: data?.length, sample: data?.slice(0, 5) })
}
