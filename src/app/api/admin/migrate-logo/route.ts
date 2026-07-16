import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  // We'll attempt to update empresa with logo_url=null (no-op) to test if column exists,
  // otherwise the column needs to be added manually.
  // This route returns the SQL to run in Supabase dashboard.
  const sql = `ALTER TABLE empresa ADD COLUMN IF NOT EXISTS logo_url text;`
  return NextResponse.json({
    sql,
    instructions: 'Ejecutá este SQL en el editor de Supabase (SQL Editor en el dashboard).',
  })
}
