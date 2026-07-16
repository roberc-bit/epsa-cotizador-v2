import type { Metadata } from 'next'
import './globals.css'

const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? ''

export const metadata: Metadata = {
  title: 'Cotizador — Escandinavia del Plata | Volvo CE',
  description: 'Configurador de equipos Volvo Construction Equipment — Escandinavia del Plata S.A.',
  icons: logoUrl ? [{ rel: 'icon', url: logoUrl }] : [],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {logoUrl && <link rel="icon" href={logoUrl} />}
      </head>
      <body>{children}</body>
    </html>
  )
}
