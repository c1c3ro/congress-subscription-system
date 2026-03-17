import Image from "next/image";
import { Metadata } from "next";
import { InscriptionForm } from "@/components/inscription-form";

export const metadata: Metadata = {
  title: "Inscrição - III Congresso de UTI",
  description: "Realize sua inscrição no III Congresso de Terapia Intensiva. Participe da maior conferência de UTI da região com workshops e networking.",
  openGraph: {
    title: "Inscreva-se no III Congresso de Terapia Intensiva",
    description: "Participe do maior evento de UTI do Cariri",
    images: [
      {
        url: "/logo-uti-adulto.webp",
        width: 350,
        height: 150,
        alt: "III Congresso de UTI",
      },
    ],
    type: "website",
    locale: "pt_BR",
  },
};

export default function InscricaoUTIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-uti-adulto.webp"
            alt="III Congresso de UTI - Terapia Intensiva"
            width={350}
            height={150}
            className="w-full max-w-sm h-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-8">
          <div className="text-center mb-8">
            <p className="text-green-700 font-semibold text-sm mb-2">
              Inscrição para o Congresso
            </p>
            <p className="text-muted-foreground text-sm">
              Preencha o formulário abaixo para realizar sua inscrição
            </p>
          </div>

          <InscriptionForm congresso="uti" congressoNome="III Congresso de Terapia Intensiva do Cariri" />
        </div>
      </div>
    </div>
  );
}
