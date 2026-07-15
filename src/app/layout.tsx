import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cotizador EPSA — Volvo CE',
  description: 'Configurador de equipos Volvo Construction Equipment — Escandinavia del Plata S.A.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
