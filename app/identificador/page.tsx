"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import QRScanner from "@/components/qr-scanner"
import GuestDisplay from "@/components/guest-display"
import { Lock, Search, Camera, List } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Guest {
  id: string
  name: string
  companion?: string
  created_at: string
  attended?: boolean // Added attended field
}

interface Confirmation {
  guestId: string
  status: string
  confirmed: boolean
  timestamp: string
}

interface GuestWithConfirmation extends Guest {
  confirmation?: Confirmation
}

export default function IdentificadorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GuestWithConfirmation | null>(null)
  const [scanKey, setScanKey] = useState(0)

  const [allGuests, setAllGuests] = useState<Guest[]>([])
  const [allConfirmations, setAllConfirmations] = useState<Confirmation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"scanner" | "list">("scanner")
  const [loadingGuests, setLoadingGuests] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadAllGuests()
    }
  }, [isAuthenticated])

  const loadAllGuests = async () => {
    setLoadingGuests(true)
    try {
      const response = await fetch("/api/admin/data")
      if (response.ok) {
        const data = await response.json()
        setAllGuests(data.guests || [])
        setAllConfirmations(data.confirmations || [])
      }
    } catch (err) {
      console.error("Error loading guests:", err)
    } finally {
      setLoadingGuests(false)
    }
  }

  const guestsWithConfirmations = useMemo(() => {
    return allGuests.map((guest) => {
      const confirmation = allConfirmations.find((c) => c.guestId === guest.id)
      return { ...guest, confirmation }
    })
  }, [allGuests, allConfirmations])

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guestsWithConfirmations

    const query = searchQuery.toLowerCase()
    return guestsWithConfirmations.filter(
      (guest) => guest.name.toLowerCase().includes(query) || guest.companion?.toLowerCase().includes(query),
    )
  }, [guestsWithConfirmations, searchQuery])

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
      console.error("Login error:", err)
      setError("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    try {
      let guestId = decodedText.trim()

      // Check if it's a URL
      try {
        const url = new URL(decodedText)
        const pathParts = url.pathname.split("/")
        guestId = pathParts[pathParts.length - 1]
      } catch {
        // Not a URL, assume it's a direct guest ID
        guestId = decodedText.trim()
      }

      // Search in local guest list
      const guest = guestsWithConfirmations.find((g) => g.id === guestId)

      if (!guest) {
        throw new Error("Convidado não encontrado")
      }

      setSelectedGuest(guest)
    } catch (err) {
      console.error("Error finding guest:", err)
      setSelectedGuest(null)
      alert("Convidado não encontrado ou QR code inválido")
    }
  }

  const handleSelectGuest = (guest: GuestWithConfirmation) => {
    setSelectedGuest(guest)
    setViewMode("scanner")
  }

  const handleAttendanceUpdate = (guestId: string, attended: boolean) => {
    setAllGuests((prevGuests) => prevGuests.map((g) => (g.id === guestId ? { ...g, attended } : g)))
    if (selectedGuest && selectedGuest.id === guestId) {
      setSelectedGuest({ ...selectedGuest, attended })
    }
  }

  const handleReset = () => {
    setSelectedGuest(null)
    setScanKey((prev) => prev + 1)
  }

  const getStatusBadge = (confirmation?: Confirmation) => {
    if (!confirmation) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          Pendente
        </Badge>
      )
    }
    if (confirmation.status === "confirmed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          Confirmado
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        Não vai
      </Badge>
    )
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
      <div className="container mx-auto max-w-6xl py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Identificador de Convidados</h1>

        {!selectedGuest && (
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={viewMode === "scanner" ? "default" : "outline"}
              onClick={() => setViewMode("scanner")}
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Scanner QR Code
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Lista de Convidados
            </Button>
          </div>
        )}

        {!selectedGuest ? (
          <>
            {viewMode === "scanner" ? (
              <QRScanner key={scanKey} onScanSuccess={handleScanSuccess} />
            ) : (
              <Card className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar por nome do convidado ou acompanhante..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingGuests ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando convidados...</div>
                ) : filteredGuests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Nenhum convidado encontrado" : "Nenhum convidado cadastrado"}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredGuests.map((guest) => (
                      <div
                        key={guest.id}
                        onClick={() => handleSelectGuest(guest)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{guest.name}</p>
                          {guest.companion && (
                            <p className="text-sm text-muted-foreground">Acompanhante: {guest.companion}</p>
                          )}
                        </div>
                        <div>{getStatusBadge(guest.confirmation)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                  Total: {filteredGuests.length} convidado(s)
                  {searchQuery && ` encontrado(s)`}
                </div>
              </Card>
            )}
          </>
        ) : (
          <GuestDisplay
            guest={selectedGuest}
            confirmation={
              selectedGuest.confirmation
                ? {
                    guest_id: selectedGuest.id,
                    status: selectedGuest.confirmation.status,
                    guest_name: selectedGuest.name,
                    confirmed_at: selectedGuest.confirmation.timestamp,
                    created_at: selectedGuest.confirmation.timestamp,
                  }
                : null
            }
            onReset={handleReset}
            onAttendanceUpdate={handleAttendanceUpdate}
          />
        )}
      </div>
    </div>
  )
}
