"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface InscritoRow {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  congresso: string
  area: string
  modalidade: string
  quantidade_workshops: number
  created_at: string
}

interface WorkshopData {
  id: string
  titulo: string
  congresso: string
  vagas_total: number
  vagas_ocupadas: number
  inscritos: InscritoRow[]
}

export default function WorkshopsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [workshops, setWorkshops] = useState<WorkshopData[]>([])
  const [selectedCongresso, setSelectedCongresso] = useState("all")
  const [openWorkshopId, setOpenWorkshopId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkshopsData()
    }
  }, [isAuthenticated])

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setError("Senha incorreta")
        return
      }

      setIsAuthenticated(true)
      setPassword("")
    } catch (err) {
      console.error(err)
      setError("Erro ao autenticar")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkshopsData = async () => {
    setIsLoadingData(true)
    setError("")

    try {
      const response = await fetch("/api/admin/workshops-data")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao carregar dados")
      }

      setWorkshops(data.workshops || [])
    } catch (err) {
      console.error(err)
      setError("Não foi possível carregar os workshops")
    } finally {
      setIsLoadingData(false)
    }
  }

  const congressoOptions = ["all", ...Array.from(new Set(workshops.map((workshop) => workshop.congresso)))]
  const filteredWorkshops = selectedCongresso === "all" ? workshops : workshops.filter((workshop) => workshop.congresso === selectedCongresso)

  const toggleWorkshop = (id: string) => {
    setOpenWorkshopId((current) => (current === id ? null : id))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-center mb-6">Login administrativo</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Digite a senha do dashboard"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-accent p-4">
      <div className="container mx-auto max-w-6xl space-y-6 py-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Workshops e inscritos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em cada workshop para ver a lista de inscritos até o momento.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>Filtrar por congresso</span>
                  <select
                    value={selectedCongresso}
                    onChange={(event) => setSelectedCongresso(event.target.value)}
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {congressoOptions.map((congresso) => (
                      <option key={congresso} value={congresso}>
                        {congresso === "all" ? "Todos" : congresso}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-sm text-secondary">
                  Total de workshops: {filteredWorkshops.length}
                </span>
                <Button type="button" variant="outline" onClick={fetchWorkshopsData} disabled={isLoadingData}>
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isLoadingData ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center text-base text-muted-foreground">
            Carregando workshops...
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-6 text-center text-base text-muted-foreground">
            Nenhum workshop encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkshops.map((workshop) => {
              const isOpen = openWorkshopId === workshop.id
              return (
                <div key={workshop.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleWorkshop(workshop.id)}
                    className="w-full px-5 py-5 text-left hover:bg-accent/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-lg font-semibold">{workshop.titulo}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workshop.congresso.toUpperCase()} • {workshop.vagas_ocupadas}/{workshop.vagas_total} inscritos
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-5 pb-5">
                      {workshop.inscritos.length === 0 ? (
                        <p className="p-5 text-sm text-muted-foreground">Nenhum inscrito até o momento.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                            <thead>
                              <tr>
                                <th className="px-4 py-3 text-muted-foreground">#</th>
                                <th className="px-4 py-3 text-muted-foreground">Nome</th>
                                <th className="px-4 py-3 text-muted-foreground">CPF</th>
                                <th className="px-4 py-3 text-muted-foreground">Email</th>
                                <th className="px-4 py-3 text-muted-foreground">Telefone</th>
                                <th className="px-4 py-3 text-muted-foreground">Área</th>
                                <th className="px-4 py-3 text-muted-foreground">Modalidade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workshop.inscritos.map((inscrito, index) => (
                                <tr key={inscrito.id} className="rounded-3xl bg-background shadow-sm">
                                  <td className="px-4 py-4 align-top text-muted-foreground">{index + 1}</td>
                                  <td className="px-4 py-4 align-top font-medium">{inscrito.nome_completo}</td>
                                  <td className="px-4 py-4 align-top">{inscrito.cpf}</td>
                                  <td className="px-4 py-4 align-top">{inscrito.email}</td>
                                  <td className="px-4 py-4 align-top">{inscrito.telefone}</td>
                                  <td className="px-4 py-4 align-top">{inscrito.area}</td>
                                  <td className="px-4 py-4 align-top">{inscrito.modalidade}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
