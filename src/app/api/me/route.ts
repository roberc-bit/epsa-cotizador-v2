import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ rol: null })

  const admin = createAdminSupabase()
  const { data: perfil } = await admin
    .from('perfiles').select('rol').eq('id', user.id).single()

  return NextResponse.json({ rol: perfil?.rol ?? null })
}
