"use client";

import { useState, useEffect, useRef } from "react";
import { Guest } from "@/lib/guests";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface ConfirmationFormProps {
  guest: Guest;
  existingConfirmation?: {
    id: string;
    guest_id: string;
    status: string;
    created_at: string;
  } | null;
}

export default function ConfirmationForm({ guest, existingConfirmation }: ConfirmationFormProps) {
  const [confirmed, setConfirmed] = useState<boolean | null>(
    existingConfirmation ? existingConfirmation.status === "confirmed" : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(!!existingConfirmation);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isSubmitted && confirmed && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        guest.id,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#1f2937",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [isSubmitted, confirmed, guest.id]);

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
      console.error("Error submitting confirmation:", error);
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
        <p className="text-muted-foreground text-balance mb-6">
          {confirmed
            ? "Obrigado por confirmar! Aguardamos você no evento."
            : "Agradecemos por nos informar. Sentiremos sua falta!"}
        </p>

        {confirmed && (
          <div className="mt-8 flex flex-col items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-border inline-block">
              <canvas ref={canvasRef}></canvas>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <span className="font-bold"> Tire um print </span> e apresente este QR Code na entrada do evento.
            </p>
          </div>
        )}
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
