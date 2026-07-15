import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const db = createAdminSupabase()
  const { data: modelos } = await db.from('modelos').select('id, codigo, nombre')
  const { count } = await db.from('items').select('id', { count: 'exact', head: true })
  const { data: sample } = await db.from('items').select('tipo, grupo_dropdown').not('grupo_dropdown', 'is', null).neq('grupo_dropdown', '').limit(3)
  return NextResponse.json({ modelos, total_items: count, sample_dropdown: sample })
}

export async function POST(req: Request) {
  const { modelo_id, items } = await req.json() as { modelo_id: string; items: Record<string,unknown>[] }
  if (!modelo_id || !items?.length) return NextResponse.json({ error: 'missing' }, { status: 400 })
  const db = createAdminSupabase()
  const { error: delErr } = await db.from('items').delete().eq('modelo_id', modelo_id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  const rows = items.map((it, idx) => ({ ...it, modelo_id, orden: idx }))
  const { data, error } = await db.from('items').insert(rows).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ inserted: data?.length })
}
