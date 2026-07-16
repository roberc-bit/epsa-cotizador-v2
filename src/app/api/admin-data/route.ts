import { createAdminSupabase } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  // Para admin verificamos sesión (getSession lee cookie, sin red para tokens válidos)
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabase()
  const { data: perfil } = await admin.from('perfiles').select('rol').eq('id', session.user.id).single()
  if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    { data: empresa },
    { data: perfiles },
    { data: modelos },
    { data: familias },
    { data: actividad },
    { data: cotizaciones },
  ] = await Promise.all([
    admin.from('empresa').select('*').single(),
    admin.from('perfiles').select('*').order('created_at'),
    admin.from('modelos').select('*, familias(nombre)').order('codigo'),
    admin.from('familias').select('*').order('orden'),
    admin.from('actividad').select('*, perfiles(nombre,email)').order('created_at', { ascending: false }).limit(100),
    admin.from('cotizaciones').select('*, perfiles(nombre), modelos(codigo,nombre)').order('created_at', { ascending: false }).limit(50),
  ])

  return NextResponse.json({
    empresa, perfiles: perfiles ?? [], modelos: modelos ?? [],
    familias: familias ?? [], actividad: actividad ?? [],
    cotizaciones: cotizaciones ?? [], currentUserId: session.user.id
  })
}
