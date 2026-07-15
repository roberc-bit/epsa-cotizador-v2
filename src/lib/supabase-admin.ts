import { createClient } from '@supabase/supabase-js'

// Server-side only admin client — uses service role key, bypasses RLS.
// NEVER import this in client components or expose to the browser.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
