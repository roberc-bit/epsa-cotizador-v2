import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Temporary setup route — will be removed after use
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('key') !== 'epsa-setup-2026') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fix admin roles
  const { data: updated, error: updateErr } = await supabase
    .from('perfiles')
    .update({ rol: 'admin', activo: true })
    .in('email', ['condorellirober@gmail.com', 'rober.condorelli@volvo.com'])
    .select('email, rol')

  // 2. Check familias
  const { data: familias } = await supabase
    .from('familias').select('slug, nombre, activo').order('orden')

  // 3. Check all perfiles
  const { data: perfiles } = await supabase
    .from('perfiles').select('email, rol, activo')

  // 4. If familias empty, re-seed
  let seeded = false
  if (!familias || familias.length === 0) {
    await supabase.from('familias').insert([
      { slug: 'camiones-articulados', nombre: 'Camiones Articulados', orden: 1, activo: true },
      { slug: 'excavadoras',          nombre: 'Excavadoras',          orden: 2, activo: true },
      { slug: 'cargadoras',           nombre: 'Cargadoras',           orden: 3, activo: true },
      { slug: 'mini-excavadoras',     nombre: 'Mini Excavadoras',     orden: 4, activo: true },
      { slug: 'compactacion',         nombre: 'Compactación',         orden: 5, activo: true },
    ])
    seeded = true
  }

  return NextResponse.json({
    updated, updateErr: updateErr?.message,
    perfiles, familias, familias_seeded: seeded
  })
}
