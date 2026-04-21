"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
  participa_noite_solene?: boolean
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

  const normalizeForSearch = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()

  const levenshteinWithin = (a: string, b: string, maxDist: number) => {
    // Early exits
    if (a === b) return true
    const alen = a.length
    const blen = b.length
    if (alen === 0) return blen <= maxDist
    if (blen === 0) return alen <= maxDist
    if (Math.abs(alen - blen) > maxDist) return false

    // Standard DP with banded early-exit for maxDist (small: 1–2)
    const prev = new Array(blen + 1)
    const curr = new Array(blen + 1)
    for (let j = 0; j <= blen; j++) prev[j] = j

    for (let i = 1; i <= alen; i++) {
      curr[0] = i
      let rowMin = curr[0]
      const ai = a.charCodeAt(i - 1)

      // Optional band limits (keeps it fast for maxDist small)
      const start = Math.max(1, i - maxDist - 1)
      const end = Math.min(blen, i + maxDist + 1)

      for (let j = 1; j <= blen; j++) {
        if (j < start || j > end) {
          curr[j] = maxDist + 1
          continue
        }
        const cost = ai === b.charCodeAt(j - 1) ? 0 : 1
        const del = prev[j] + 1
        const ins = curr[j - 1] + 1
        const sub = prev[j - 1] + cost
        const v = Math.min(del, ins, sub)
        curr[j] = v
        if (v < rowMin) rowMin = v
      }

      if (rowMin > maxDist) return false
      for (let j = 0; j <= blen; j++) prev[j] = curr[j]
    }

    return prev[blen] <= maxDist
  }

  const matchesName = (rawQuery: string, rawName: string) => {
    const q = normalizeForSearch(rawQuery)
    if (!q) return true

    const name = normalizeForSearch(rawName)
    if (name.includes(q)) return true // fast path (accent-insensitive substring)

    // Fuzzy: tolerate 1–2 typos per term
    const qParts = q.split(/\s+/).filter(Boolean)
    const nameParts = name.split(/\s+/).filter(Boolean)
    const maxDist = q.length <= 4 ? 1 : 2

    return qParts.every((qp) => {
      if (qp.length <= 2) return name.includes(qp) // too short for Levenshtein
      // Compare against each name token (and also a prefix to handle missing tail)
      return nameParts.some((np) => {
        if (np.includes(qp)) return true
        const prefix = np.slice(0, Math.max(qp.length, Math.min(np.length, qp.length + 1)))
        return levenshteinWithin(qp, np, maxDist) || levenshteinWithin(qp, prefix, maxDist)
      })
    })
  }

  const filteredInscritos = useMemo(() => {
    const raw = searchQuery.trim()
    if (!raw) return allInscritos

    const cpfQuery = raw.replace(/\D/g, "")
    return allInscritos.filter((inscrito) => {
      const cpfMatch = cpfQuery ? inscrito.cpf.includes(cpfQuery) : false
      const nameMatch = matchesName(raw, inscrito.nome_completo)
      return cpfMatch || nameMatch
    })
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

  // Ref para acessar inscritos no callback sem causar re-render
  const allInscritosRef = useRef<Inscrito[]>([])
  
  // Manter ref atualizada
  useEffect(() => {
    allInscritosRef.current = allInscritos
  }, [allInscritos])

  const handleScanSuccess = useCallback((decodedText: string) => {
    try {
      const rawtextId = decodedText.trim()
      console.log("[v0] QR Code lido com sucesso:", rawtextId)

      // Remove espaços em branco
      let inscritoId = rawtextId.replace(/\s+/g, "")

      // Se for uma URL, extrai o último segmento
      if (inscritoId.includes("/")) {
        try {
          const url = new URL(rawtextId)
          inscritoId = url.pathname.split("/").filter(Boolean).pop() || inscritoId
          console.log("[v0] ID extraído da URL:", inscritoId)
        } catch {
          // Se não for URL válida, usa como está
          inscritoId = rawtextId.trim()
        }
      }

      const currentInscritos = allInscritosRef.current
      console.log("[v0] Procurando por ID:", inscritoId)
      console.log("[v0] Total de inscritos disponíveis:", currentInscritos.length)

      // Busca exata por ID
      let inscrito = currentInscritos.find((i) => i.id === inscritoId)

      // Se não encontrou, tenta busca parcial (caso o QR code tenha sido lido com caracteres extras)
      if (!inscrito && inscritoId.length > 10) {
        inscrito = currentInscritos.find((i) => 
          inscritoId.includes(i.id) || i.id.includes(inscritoId)
        )
      }

      if (!inscrito) {
        console.log("[v0] IDs disponíveis (primeiros 5):", currentInscritos.slice(0, 5).map((i) => i.id))
        throw new Error(`Inscrito com ID "${inscritoId}" não encontrado`)
      }

      console.log("[v0] Inscrito encontrado:", inscrito.nome_completo)
      setSelectedInscrito(inscrito)
    } catch (err) {
      console.error("[v0] Erro:", err instanceof Error ? err.message : String(err))
      setSelectedInscrito(null)
      alert(
        `Erro ao processar QR code: ${err instanceof Error ? err.message : "QR code inválido"}`,
      )
      // Reinicia o scanner após erro
      setScanKey((prev) => prev + 1)
    }
  }, [])

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

  useEffect(() => {
    if (selectedInscrito) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [selectedInscrito])

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
              loadingInscritos ? (
                <Card className="p-6">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando dados dos inscritos...</p>
                    <p className="text-sm text-muted-foreground mt-2">Aguarde antes de escanear</p>
                  </div>
                </Card>
              ) : allInscritos.length === 0 ? (
                <Card className="p-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Nenhum inscrito cadastrado no sistema.</p>
                    <Button onClick={loadAllInscritos} variant="outline">
                      Recarregar dados
                    </Button>
                  </div>
                </Card>
              ) : (
                <QRScanner key={scanKey} onScanSuccess={handleScanSuccess} />
              )
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
            )
            }
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
