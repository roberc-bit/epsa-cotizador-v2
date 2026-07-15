import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

  let updated = 0
  for (const row of rows.slice(1)) {
    const codigo = String(row[0] ?? '').trim()
    const precioFob = parseFloat(row[2]) || null
    const precioLista = parseFloat(row[3]) || null
    if (!codigo || !precioLista) continue

    const { error } = await supabase
      .from('modelos')
      .update({ precio_fob: precioFob, precio_lista: precioLista, updated_at: new Date().toISOString() })
      .eq('codigo', codigo)
    if (!error) updated++
  }

  return NextResponse.json({ success: true, updated })
}
