"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, CheckCircle2, Clock, RotateCcw, Users } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

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

interface InscritoDisplayProps {
  inscrito: Inscrito
  onReset: () => void
  onAttendanceUpdate?: (inscritoId: string, attended: boolean) => void
}

export default function InscritoDisplay({ inscrito, onReset, onAttendanceUpdate }: InscritoDisplayProps) {
  const [attended, setAttended] = useState(inscrito.attended || false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleAttendanceToggle = async () => {
    const newAttendedValue = !attended
    setIsUpdating(true)

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: inscrito.id, attended: newAttendedValue, type: "inscrito" }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar")

      setAttended(newAttendedValue)
      onAttendanceUpdate?.(inscrito.id, newAttendedValue)

      toast({
        title: newAttendedValue ? "Comparecimento registrado" : "Comparecimento removido",
        description: `${inscrito.nome_completo} ${newAttendedValue ? "foi marcado como presente" : "foi desmarcado como presente"}.`,
      })
    } catch (error) {
      console.error("Error updating attendance:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o comparecimento.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getCongressoLabel = (congresso: string) => {
    const labels: Record<string, string> = {
      uti: "Congresso UTI",
      utipedneo: "Congresso UTI Ped e Neo",
    }
    return labels[congresso] || congresso
  }

  const getTipoAlunoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      nad: "Aluno NAD",
      sao_camilo: "Aluno São Camilo",
    }
    return labels[tipo] || tipo
  }

  const getModalidadeLabel = (modalidade: string) => {
    const labels: Record<string, string> = {
      estudante: "Estudante",
      profissional: "Profissional",
      parceiro: "Parceiro",
    }
    return labels[modalidade] || modalidade
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <Card className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 md:p-3 rounded-full shrink-0">
              <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold wrap-break-word">{inscrito.nome_completo}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{getCongressoLabel(inscrito.congresso)}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 self-start sm:self-auto ${
              inscrito.workshops.length > 0
                ? "bg-green-50 text-green-700 border-green-300"
                : "bg-blue-50 text-blue-700 border-blue-300"
            }`}
          >
            <span className="flex items-center gap-2">
              {inscrito.workshops.length > 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {inscrito.workshops.length > 0 ? "Confirmado" : "Inscrito"}
            </span>
          </Badge>
        </div>

        <div className="space-y-3 md:space-y-4">

        {/* Workshops */}
          {inscrito.workshops.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 md:p-6 border border-purple-200">
              <h3 className="font-semibold text-base md:text-lg mb-4">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Workshops ({inscrito.workshops.length})
                </span>
              </h3>
              <div className="space-y-2">
                {inscrito.workshops.map((workshop) => (
                  <div
                    key={workshop.id}
                    className="bg-purple-100 rounded p-3 flex items-center justify-between"
                  >
                    <p className="font-medium text-sm md:text-base">{workshop.titulo}</p>
                    {/* <Badge variant="secondary" className="text-xs">
                      {workshop.congresso}
                    </Badge> */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações do Congresso */}
          <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-200">
            <h3 className="font-semibold text-base md:text-lg mb-4">Congresso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Congresso</p>
                <p className="font-medium">{getCongressoLabel(inscrito.congresso)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Área</p>
                <p className="font-medium">{inscrito.area}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Modalidade</p>
                <p className="font-medium">{getModalidadeLabel(inscrito.modalidade)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Data de Inscrição</p>
                <p className="font-medium">
                  {format(new Date(inscrito.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Noite Solene</p>
                <p className={`font-medium ${inscrito.participa_noite_solene ? "text-green-600" : "text-red-600"}`}>
                  {inscrito.participa_noite_solene ? "✓ Participando" : "✗ Não Participando"}
                </p>
              </div>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div className="bg-slate-50 rounded-lg p-4 md:p-6 border border-slate-200">
            <h3 className="font-semibold text-base md:text-lg mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">CPF</p>
                <p className="font-medium">{inscrito.cpf}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium break-all">{inscrito.email}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Telefone</p>
                <p className="font-medium">{inscrito.telefone}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Aluno NAD</p>
                <p className="font-medium">{getTipoAlunoLabel(inscrito.tipo_aluno)}</p>
              </div>
            </div>
          </div>



          {/* Comparecimento */}
          {/* <div
            className={`rounded-lg p-4 md:p-6 border-2 transition-colors ${
              attended
                ? "bg-emerald-50 dark:bg-gray-50 border-emerald-500"
                : "bg-gray-50 dark:bg-gray-100 border-gray-200 dark:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-base md:text-lg">Comparecimento ao Congresso</h3>
              <button
                onClick={handleAttendanceToggle}
                disabled={isUpdating}
                className={`relative inline-flex h-10 w-18 shrink-0 items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ${
                  attended
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                }`}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-200 ${
                    attended ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {attended ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Presente</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Não registrado</span>
                </>
              )}
            </div>
          </div> */}

          {/* Botão Voltar */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onReset} variant="outline" className="flex items-center gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              Voltar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
