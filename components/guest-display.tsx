"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Users, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

interface GuestDisplayProps {
  guest: Guest
  confirmation: Confirmation | null
  onReset: () => void
}

export default function GuestDisplay({ guest, confirmation, onReset }: GuestDisplayProps) {
  const getStatusInfo = () => {
    if (!confirmation) {
      return {
        icon: <Clock className="w-6 h-6" />,
        label: "Pendente",
        variant: "secondary" as const,
        bgColor: "bg-secondary/10",
        textColor: "text-secondary-foreground",
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
    <div className="space-y-4">
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              {guest.companion ? <Users className="w-8 h-8 text-primary" /> : <User className="w-8 h-8 text-primary" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{guest.name}</h2>
              {guest.companion && <p className="text-lg text-muted-foreground">e {guest.companion}</p>}
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="text-base px-4 py-2">
            <span className="flex items-center gap-2">
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </Badge>
        </div>

        <div className="space-y-4">
          <div className={`${statusInfo.bgColor} ${statusInfo.textColor} rounded-lg p-6`}>
            <h3 className="font-semibold text-lg mb-2">Status do Convite</h3>
            <p className="text-sm">
              {!confirmation && "Este convidado ainda não respondeu ao convite."}
              {confirmation?.status === "confirmed" &&
                `Confirmado em ${format(new Date(confirmation.confirmed_at || confirmation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
              {confirmation?.status === "declined" &&
                `Recusado em ${format(new Date(confirmation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
            </p>
          </div>

          <div className="bg-accent rounded-lg p-6 border border-primary/20">
            <h3 className="font-semibold mb-3">Informações do Convite</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Convidado:</span>
                <span className="font-mono">{guest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span>{guest.companion ? "Convite Duplo" : "Convite Individual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cadastrado em:</span>
                <span>{format(new Date(guest.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Button onClick={onReset} className="w-full" size="lg">
        <RotateCcw className="w-5 h-5 mr-2" />
        Escanear Novo QR Code
      </Button>
    </div>
  )
}
