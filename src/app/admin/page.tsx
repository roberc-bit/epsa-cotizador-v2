import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import AdminPanel from '@/components/admin/AdminPanel'

export default async function AdminPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles').select('*').eq('id', user.id).single()

  if (perfil?.rol !== 'admin') {
    return (
      <>
        <Header />
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Acceso restringido</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Solo los administradores pueden acceder a este panel.</p>
        </div>
      </>
    )
  }

  const [
    { data: empresa },
    { data: perfiles },
    { data: modelos },
    { data: familias },
    { data: actividad },
    { data: cotizaciones },
  ] = await Promise.all([
    supabase.from('empresa').select('*').single(),
    supabase.from('perfiles').select('*').order('created_at'),
    supabase.from('modelos').select('*, familias(nombre)').order('codigo'),
    supabase.from('familias').select('*').order('orden'),
    supabase.from('actividad').select('*, perfiles(nombre,email)').order('created_at', { ascending: false }).limit(100),
    supabase.from('cotizaciones').select('*, perfiles(nombre), modelos(codigo,nombre)').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <>
      <Header />
      <AdminPanel
        empresa={empresa}
        perfiles={perfiles ?? []}
        modelos={modelos ?? []}
        familias={familias ?? []}
        actividad={actividad ?? []}
        cotizaciones={cotizaciones ?? []}
        currentUserId={user.id}
      />
    </>
  )
}
