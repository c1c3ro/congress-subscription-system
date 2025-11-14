"use client";

import { useState } from "react";
import { Guest } from "@/lib/guests";
import { Button } from "@/components/ui/button";

interface ConfirmationFormProps {
  guest: Guest;
}

export default function ConfirmationForm({ guest }: ConfirmationFormProps) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (willAttend: boolean) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          confirmed: willAttend,
        }),
      });

      if (response.ok) {
        setConfirmed(willAttend);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("[v0] Error submitting confirmation:", error);
      alert("Erro ao enviar confirmação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            confirmed
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {confirmed ? (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {confirmed ? "Presença Confirmada!" : "Recebemos sua resposta"}
        </h3>
        <p className="text-muted-foreground text-balance">
          {confirmed
            ? "Obrigado por confirmar! Aguardamos você no evento."
            : "Agradecemos por nos informar. Sentiremos sua falta!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Você confirma sua presença no evento?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="h-auto py-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-semibold">Sim</span>
            </div>
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            variant="outline"
            className="h-auto py-4 border-2"
          >
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="font-semibold">Não</span>
            </div>
          </Button>
        </div>
      </div>

    </div>
  );
}
