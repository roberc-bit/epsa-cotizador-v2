import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = createAdminSupabase()
  const { data } = await supabase.from('empresa').select('logo_url').eq('id', 1).single()
  return NextResponse.json({ logo_url: (data as any)?.logo_url ?? null })
}
