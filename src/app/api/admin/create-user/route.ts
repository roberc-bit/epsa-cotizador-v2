import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Cliente admin con service role (solo para crear usuarios)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Solo admins' }, { status: 403 })

  const { nombre, email, password, rol } = await req.json()

  const { data, error } = await adminClient.auth.admin.createUser({
    email, password,
    user_metadata: { nombre, rol },
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: newPerfil } = await supabase.from('perfiles').select('*').eq('id', data.user.id).single()
  return NextResponse.json({ perfil: newPerfil })
}
