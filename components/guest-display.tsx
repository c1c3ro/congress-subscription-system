"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Users, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface Guest {
  id: string
  name: string
  companion?: string
  created_at: string
  attended?: boolean
}

interface Confirmation {
  guest_id: string
  status: string
  guest_name: string
  confirmed_at: string
  created_at: string
}

interface GuestDisplayProps {
  guest: Guest
  confirmation: Confirmation | null
  onReset: () => void
  onAttendanceUpdate?: (guestId: string, attended: boolean) => void
}

export default function GuestDisplay({ guest, confirmation, onReset, onAttendanceUpdate }: GuestDisplayProps) {
  const [attended, setAttended] = useState(guest.attended || false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleAttendanceToggle = async () => {
    const newAttendedValue = !attended
    setIsUpdating(true)

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id, attended: newAttendedValue }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar")

      setAttended(newAttendedValue)
      onAttendanceUpdate?.(guest.id, newAttendedValue)

      toast({
        title: newAttendedValue ? "Comparecimento registrado" : "Comparecimento removido",
        description: `${guest.name} ${newAttendedValue ? "foi marcado como presente" : "foi desmarcado como presente"}.`,
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

  const getStatusInfo = () => {
    if (!confirmation) {
      return {
        icon: <Clock className="w-6 h-6" />,
        label: "Pendente",
        variant: "secondary" as const,
        bgColor: "bg-slate-100 dark:bg-slate-800",
        textColor: "text-slate-900 dark:text-slate-100",
      }
    }

    if (confirmation.status === "confirmed") {
      return {
        icon: <CheckCircle2 className="w-6 h-6" />,
        label: "Confirmado",
        variant: "default" as const,
        bgColor: "bg-green-500/10",
        textColor: "text-green-700 dark:text-green-400",
      }
    }

    return {
      icon: <XCircle className="w-6 h-6" />,
      label: "Recusado",
      variant: "destructive" as const,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="space-y-3 md:space-y-4">
      <Card className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 md:p-3 rounded-full shrink-0">
              {guest.companion ? (
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              ) : (
                <User className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold break-words">{guest.name}</h2>
              {guest.companion && (
                <p className="text-base md:text-lg text-muted-foreground break-words">e {guest.companion}</p>
              )}
            </div>
          </div>
          <Badge
            variant={statusInfo.variant}
            className="text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2 self-start sm:self-auto"
          >
            <span className="flex items-center gap-2">
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </Badge>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div
            className={`rounded-lg p-4 md:p-6 border-2 transition-colors ${
              attended
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500"
                : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-semibold text-base md:text-lg">Comparecimento ao Evento</h3>
              <button
                onClick={handleAttendanceToggle}
                disabled={isUpdating}
                className={`relative inline-flex h-10 w-[72px] shrink-0 items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ${
                  attended
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                }`}
                aria-label={attended ? "Marcar como não presente" : "Marcar como presente"}
              >
                <span
                  className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-2 transition-transform duration-200 ${
                    attended ? "translate-x-9 ring-emerald-600" : "translate-x-1 ring-slate-400 dark:ring-slate-500"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {attended ? "✓ Este convidado compareceu ao evento" : "Ative o botão quando o convidado chegar ao evento"}
            </p>
          </div>

          <div className={`${statusInfo.bgColor} ${statusInfo.textColor} rounded-lg p-4 md:p-6`}>
            <h3 className="font-semibold text-base md:text-lg mb-2">Status do Convite</h3>
            <p className="text-sm leading-relaxed">
              {!confirmation && "Este convidado ainda não respondeu ao convite."}
              {confirmation?.status === "confirmed" &&
                `Confirmado em ${format(new Date(confirmation.confirmed_at || confirmation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
              {confirmation?.status === "declined" &&
                `Recusado em ${format(new Date(confirmation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
            </p>
          </div>

          <div className="bg-accent rounded-lg p-4 md:p-6 border border-primary/20">
            <h3 className="font-semibold mb-3 text-base md:text-lg">Informações do Convite</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-muted-foreground">ID do Convidado:</span>
                <span className="font-mono text-xs sm:text-sm break-all">{guest.id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-muted-foreground">Tipo:</span>
                <span>{guest.companion ? "Convite Duplo" : "Convite Individual"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span className="text-muted-foreground">Cadastrado em:</span>
                <span>{format(new Date(guest.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Button onClick={onReset} className="w-full text-base" size="lg">
        <RotateCcw className="w-5 h-5 mr-2" />
        Escanear Novo QR Code
      </Button>
    </div>
  )
}
