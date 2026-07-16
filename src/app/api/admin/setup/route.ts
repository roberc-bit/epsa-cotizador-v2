import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = createAdminSupabase()
  const results: Record<string, string> = {}

  // 1. Create logos bucket
  const { error: bucketErr } = await supabase.storage.createBucket('logos', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  })
  results.logos_bucket = bucketErr
    ? (bucketErr.message.includes('already exists') ? 'ya existe ✓' : `error: ${bucketErr.message}`)
    : 'creado ✓'

  // 2. Ensure model-images bucket exists
  const { error: miErr } = await supabase.storage.createBucket('model-images', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  })
  results.model_images_bucket = miErr
    ? (miErr.message.includes('already exists') ? 'ya existe ✓' : `error: ${miErr.message}`)
    : 'creado ✓'

  // 3. Ensure family-images bucket exists
  const { error: fiErr } = await supabase.storage.createBucket('family-images', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  })
  results.family_images_bucket = fiErr
    ? (fiErr.message.includes('already exists') ? 'ya existe ✓' : `error: ${fiErr.message}`)
    : 'creado ✓'

  return NextResponse.json({ ok: true, results })
}
