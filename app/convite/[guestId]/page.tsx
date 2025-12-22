import { notFound } from "next/navigation"
import ConfirmationForm from "@/components/confirmation-form"
import { createClient } from "@/lib/supabase/server"

interface PageProps {
  params: Promise<{ guestId: string }>
}

export default async function GuestConfirmationPage({ params }: PageProps) {
  const { guestId } = await params

  const supabase = await createClient()

  const { data: guest } = await supabase.from("test_guests").select("*").eq("id", guestId).single()

  if (!guest) {
    notFound()
  }

  const { data: existingConfirmation } = await supabase
    .from("test_confirmations")
    .select("*")
    .eq("guest_id", guestId)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h1 className="text-4xl font-bold text-primary">Sistema de Confirmação</h1>
        </div>

        {/* Card Principal */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {/* Saudação Personalizada */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
              Olá, {guest.name}
              {guest.companion ? "" : "!"}
            </h1>
            {guest.companion && <p className="text-lg text-muted-foreground mb-3">e {guest.companion}!</p>}
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              {guest.companion ? "Vocês estão convidados" : "Você está convidado(a)"} para o evento de lançamento do{" "}
              <span className="font-semibold text-primary">Evento de Teste</span>
            </p>
          </div>

          {/* Informações do Evento */}
          <div className="bg-accent rounded-xl p-6 mb-8 border border-primary/20">
            <h2 className="font-semibold text-accent-foreground mb-4 text-lg">Detalhes do Evento</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-foreground">Data e Horário</p>
                  <p className="text-muted-foreground">28/11/2025 às 20h</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-foreground">Local</p>
                  <p className="text-muted-foreground">Rua Catulo da Paixão Cearense, 175 - Pátio Cariri, 31º andar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Confirmação */}
          <ConfirmationForm guest={guest} existingConfirmation={existingConfirmation} />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">Estamos ansiosos para contar com sua presença!</p>
      </div>
    </div>
  )
}
