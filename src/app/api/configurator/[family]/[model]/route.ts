import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ family: string; model: string }> }
) {
  // Verificar auth
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Log actividad (no bloqueante)
  admin.from('actividad').insert({
    usuario_id: user.id,
    tipo: 'modelo_visto',
    detalle: `Vista: ${modelCode}`,
    metadata: { modelo_id: modelo.id, familia: family }
  }).then(() => {})

  return NextResponse.json({ familia, modelo, items: items ?? [], empresa, userId: user.id })
}
