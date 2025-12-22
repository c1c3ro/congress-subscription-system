import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Lançamento - NCS',
  description: 'Confirme sua presença no lançamento do Núcleo de Carreira em Saúde',
  generator: '',
  icons: {
    icon: [
      {
        url: '/ogimage.webp',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/ogimage.webp',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Lançamento - NCS',               // pode personalizar
    description: 'Confirme sua presença no lançamento do Núcleo de Carreira em Saúde',// idem
    url: 'lancamento-ncs.vercel.app',// coloque o domínio real
    images: [
      {
        url: '/ogimage.webp', // ou '/og-image.jpg' se estiver no public/
        alt: 'Imagem de pré-visualização OG'
      }
    ],
    siteName: 'Lançamento - NCS'
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
