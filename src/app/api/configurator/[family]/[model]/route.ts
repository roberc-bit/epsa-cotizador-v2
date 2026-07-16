import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ family: string; model: string }> }
) {
  // Auth ya verificada por middleware (cookie check). Usamos admin directo.
  const { family, model: modelCode } = await params
  const admin = createAdminSupabase()

  const [
    { data: familia },
    { data: modelo },
    { data: empresa },
  ] = await Promise.all([
    admin.from('familias').select('*').eq('slug', family).single(),
    admin.from('modelos').select('*').eq('codigo', modelCode).single(),
    admin.from('empresa').select('*').single(),
  ])

  if (!familia || !modelo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items } = await admin
    .from('items').select('*')
    .eq('modelo_id', modelo.id).eq('activo', true)
    .order('orden')

  return NextResponse.json({ familia, modelo, items: items ?? [], empresa, userId: '' })
}
