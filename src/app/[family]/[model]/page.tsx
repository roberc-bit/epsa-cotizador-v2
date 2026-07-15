import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Configurator from '@/components/Configurator'
import type { Item } from '@/lib/types'

export default async function ModelPage({ params }: { params: Promise<{ family: string; model: string }> }) {
  const { family, model: modelCode } = await params
  const supabase = await createServerSupabase()

  const { data: familia } = await supabase
    .from('familias').select('*').eq('slug', family).single()
  if (!familia) notFound()

  const { data: modelo } = await supabase
    .from('modelos').select('*').eq('codigo', modelCode).single()
  if (!modelo) notFound()

  const { data: items } = await supabase
    .from('items').select('*')
    .eq('modelo_id', modelo.id).eq('activo', true)
    .order('orden')

  // Log actividad
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('actividad').insert({
      usuario_id: user.id,
      tipo: 'modelo_visto',
      detalle: `Vista: ${modelCode}`,
      metadata: { modelo_id: modelo.id, familia: family }
    })
  }

  const { data: empresa } = await supabase.from('empresa').select('*').single()

  return (
    <>
      <Header />
      <Configurator
        modelo={modelo}
        items={(items as Item[]) ?? []}
        familia={familia}
        empresa={empresa}
        userId={user?.id ?? ''}
      />
    </>
  )
}
