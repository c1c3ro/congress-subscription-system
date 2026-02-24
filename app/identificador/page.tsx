"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import QRScanner from "@/components/qr-scanner"
import InscritoDisplay from "@/components/inscrito-display"
import { Lock, Search, Camera, List } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Inscrito {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  congresso: string
  tipo_aluno: string
  area: string
  modalidade: string
  quantidade_workshops: number
  workshops: Array<{
    id: string
    titulo: string
    congresso: string
  }>
  created_at: string
  attended?: boolean
}

export default function IdentificadorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedInscrito, setSelectedInscrito] = useState<Inscrito | null>(null)
  const [scanKey, setScanKey] = useState(0)

  const [allInscritos, setAllInscritos] = useState<Inscrito[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"scanner" | "list">("scanner")
  const [loadingInscritos, setLoadingInscritos] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadAllInscritos()
    }
  }, [isAuthenticated])

  const loadAllInscritos = async () => {
    setLoadingInscritos(true)
    try {
      const response = await fetch("/api/admin/inscricoes-data")
      if (response.ok) {
        const data = await response.json()
        setAllInscritos(data.inscritos || [])
      }
    } catch (err) {
      console.error("Error loading inscritos:", err)
    } finally {
      setLoadingInscritos(false)
    }
  }

  const filteredInscritos = useMemo(() => {
    if (!searchQuery.trim()) return allInscritos

    const query = searchQuery.toLowerCase()
    return allInscritos.filter(
      (inscrito) =>
        inscrito.nome_completo.toLowerCase().includes(query) || inscrito.cpf.includes(query),
    )
  }, [allInscritos, searchQuery])

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
      let inscritoId = decodedText.trim()

      // Check if it's a URL
      try {
        const url = new URL(decodedText)
        const pathParts = url.pathname.split("/")
        inscritoId = pathParts[pathParts.length - 1]
      } catch {
        // Not a URL, assume it's a direct ID
        inscritoId = decodedText.trim()
      }

      // Search in local list
      const inscrito = filteredInscritos.find((i) => i.id === inscritoId)

      if (!inscrito) {
        throw new Error("Inscrito não encontrado")
      }

      setSelectedInscrito(inscrito)
    } catch (err) {
      console.error("Error finding inscrito:", err)
      setSelectedInscrito(null)
      alert("Inscrito não encontrado ou QR code inválido")
    }
  }

  const handleSelectInscrito = (inscrito: Inscrito) => {
    setSelectedInscrito(inscrito)
    setViewMode("scanner")
  }

  const handleAttendanceUpdate = (inscritoId: string, attended: boolean) => {
    setAllInscritos((prevInscritos) =>
      prevInscritos.map((i) => (i.id === inscritoId ? { ...i, attended } : i)),
    )
    if (selectedInscrito && selectedInscrito.id === inscritoId) {
      setSelectedInscrito({ ...selectedInscrito, attended })
    }
  }

  const handleReset = () => {
    setSelectedInscrito(null)
    setScanKey((prev) => prev + 1)
  }

  const getCongressoBadge = (congresso: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      uti: { bg: "bg-blue-50", text: "text-blue-700" },
      utipedneo: { bg: "bg-purple-50", text: "text-purple-700" },
    }
    const style = colors[congresso] || { bg: "bg-gray-50", text: "text-gray-700" }
    const labels: Record<string, string> = {
      uti: "UTI",
      utipedneo: "UTI Ped e Neo",
    }
    return (
      <Badge variant="outline" className={`${style.bg} border-none ${style.text}`}>
        {labels[congresso] || congresso}
      </Badge>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Identificador de Inscritos</h1>
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
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent p-3 md:p-4">
      <div className="container mx-auto max-w-6xl py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Identificador de Inscritos</h1>

        {!selectedInscrito && (
          <div className="flex justify-center gap-2 mb-4 md:mb-6">
            <Button
              variant={viewMode === "scanner" ? "default" : "outline"}
              onClick={() => setViewMode("scanner")}
              className="flex items-center gap-2 text-sm md:text-base"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scanner QR Code</span>
              <span className="sm:hidden">Scanner</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2 text-sm md:text-base"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista de Inscritos</span>
              <span className="sm:hidden">Lista</span>
            </Button>
          </div>
        )}

        {!selectedInscrito ? (
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
                      placeholder="Buscar por nome ou CPF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingInscritos ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando inscritos...</div>
                ) : filteredInscritos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Nenhum inscrito encontrado" : "Nenhum inscrito cadastrado"}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-150 overflow-y-auto">
                    {filteredInscritos.map((inscrito) => (
                      <div
                        key={inscrito.id}
                        onClick={() => handleSelectInscrito(inscrito)}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{inscrito.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">CPF: {inscrito.cpf}</p>
                          <p className="text-xs text-muted-foreground">Modalidade: {inscrito.modalidade}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 shrink-0">
                          {getCongressoBadge(inscrito.congresso)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                  Total: {filteredInscritos.length} inscrito(s)
                  {searchQuery && ` encontrado(s)`}
                </div>
              </Card>
            )}
          </>
        ) : (
          <InscritoDisplay
            inscrito={selectedInscrito}
            onReset={handleReset}
            onAttendanceUpdate={handleAttendanceUpdate}
          />
        )}
      </div>
    </div>
  )
}
