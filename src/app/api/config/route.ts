import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

// Returns logo URL from Storage (no DB column needed)
// Checks 'logos' bucket for logo.png / logo.svg / logo.jpg / logo.webp
export async function GET() {
  const supabase = createAdminSupabase()

  const extensions = ['svg', 'png', 'jpg', 'jpeg', 'webp']
  let logo_url: string | null = null

  for (const ext of extensions) {
    const { data } = supabase.storage.from('logos').getPublicUrl(`logo.${ext}`)
    // Check if file actually exists
    const res = await fetch(data.publicUrl, { method: 'HEAD' }).catch(() => null)
    if (res?.ok) {
      logo_url = data.publicUrl
      break
    }
  }

  return NextResponse.json({ logo_url })
}
