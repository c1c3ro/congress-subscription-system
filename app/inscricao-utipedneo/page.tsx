import Image from "next/image";
import { Metadata } from "next";
import { InscriptionForm } from "@/components/inscription-form";

export const metadata: Metadata = {
  title: "Inscrição - III Congresso de UTI Pediátrica e Neonatal",
  description: "Realize sua inscrição no III Congresso de UTI Pediátrica e Neonatal. Participe de workshops especializados e networking com profissionais da área.",
  openGraph: {
    title: "Inscreva-se no III Congresso de UTI Pediátrica e Neonatal",
    description: "Participe do maior evento de UTI Infantil do Cariri",
    images: [
      {
        url: "/logo-uti-pedneo.webp",
        width: 350,
        height: 150,
        alt: "III Congresso de UTI Pediátrica e Neonatal",
      },
    ],
    type: "website",
    locale: "pt_BR",
  },
};

export default function InscricaoUTIPedNeoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-uti-pedneo.webp"
            alt="III Congresso de UTI Pediátrica e Neonatal"
            width={350}
            height={150}
            className="w-full max-w-sm h-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 p-8">
          <div className="text-center mb-8">
            <p className="text-rose-700 font-semibold text-sm mb-2">
              Inscrição para o Congresso
            </p>
            <p className="text-muted-foreground text-sm">
              Preencha o formulário abaixo para realizar sua inscrição
            </p>
          </div>

          <InscriptionForm congresso="utipedneo" congressoNome="III Congresso de UTI Pediátrica e Neonatal do Cariri" />
        </div>
      </div>
    </div>
  );
}
