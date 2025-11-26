"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import QRScanner from "@/components/qr-scanner"
import GuestDisplay from "@/components/guest-display"
import { Lock } from "lucide-react"

interface Guest {
  id: string
  name: string
  companion?: string
  created_at: string
}

interface Confirmation {
  guest_id: string
  status: string
  guest_name: string
  confirmed_at: string
  created_at: string
}

export default function IdentificadorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [scanKey, setScanKey] = useState(0)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPassword("")
      } else {
        setError("Senha incorreta")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    try {
      console.log("[v0] QR Code scanned:", decodedText)

      let guestId = decodedText.trim()

      // Check if it's a URL
      try {
        const url = new URL(decodedText)
        const pathParts = url.pathname.split("/")
        guestId = pathParts[pathParts.length - 1]
      } catch {
        // Not a URL, assume it's a direct guest ID
        // Remove any extra whitespace or characters
        guestId = decodedText.trim()
      }

      console.log("[v0] Fetching guest with ID:", guestId)

      // Buscar informações do convidado
      const response = await fetch(`/api/identificador/guest?id=${guestId}`)

      if (!response.ok) {
        throw new Error("Convidado não encontrado")
      }

      const data = await response.json()
      setGuest(data.guest)
      setConfirmation(data.confirmation)
    } catch (err) {
      console.error("[v0] Error fetching guest:", err)
      setGuest(null)
      setConfirmation(null)
      alert("Convidado não encontrado ou QR code inválido")
    }
  }

  const handleReset = () => {
    setGuest(null)
    setConfirmation(null)
    setScanKey((prev) => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Identificador de Convidados</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Identificador de Convidados</h1>

        {!guest ? (
          <QRScanner key={scanKey} onScanSuccess={handleScanSuccess} />
        ) : (
          <GuestDisplay guest={guest} confirmation={confirmation} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}
