import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Confirmação - Teste",
  description: "Sistema de teste para confirmação de presença em eventos",
  generator: "",
  icons: {
    icon: [
      {
        url: "/ogimage.webp",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/ogimage.webp",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Sistema de Confirmação - Teste",
    description: "Sistema de teste para confirmação de presença em eventos",
    url: "lancamento-ncs.vercel.app",
    images: [
      {
        url: "/ogimage.webp",
        alt: "Imagem de pré-visualização OG",
      },
    ],
    siteName: "Sistema de Confirmação - Teste",
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
