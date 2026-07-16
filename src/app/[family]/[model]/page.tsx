import Header from '@/components/Header'
import ConfiguratorLoader from '@/components/ConfiguratorLoader'

export default async function ModelPage({ params }: { params: Promise<{ family: string; model: string }> }) {
  const { family, model } = await params
  return (
    <>
      <Header />
      <ConfiguratorLoader family={family} model={model} />
    </>
  )
}
