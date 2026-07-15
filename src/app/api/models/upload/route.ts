import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // The actual Excel parsing runs server-side via Python script or xlsx library.
  // For now this endpoint accepts the upload and returns a placeholder.
  // Full implementation: parse Excel, extract items by column F/G/color, insert to DB.
  const formData = await req.formData()
  const file = formData.get('file') as File
  const familiaId = formData.get('familia_id') as string

  if (!file || !familiaId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  // TODO: Parse Excel with xlsx library, detect item types, insert items
  // See /supabase/schema.sql for the items table structure
  return NextResponse.json({ success: true, codigo: 'PENDIENTE', items: 0, message: 'Parsing en implementación' })
}
