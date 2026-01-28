import Image from "next/image";
import { InscriptionForm } from "@/components/inscription-form";

export const metadata = {
  title: "Inscrição - III Congresso de UTI",
  description: "Realize sua inscrição no III Congresso de UTI",
};

export default function InscricaoUTIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-muted py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.webp"
            alt="Núcleo de Carreira em Saúde"
            width={280}
            height={84}
            className="w-full max-w-[280px]"
          />
        </div>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              III Congresso de UTI
            </h1>
            <p className="text-muted-foreground">
              Preencha o formulário abaixo para realizar sua inscrição
            </p>
          </div>

          <InscriptionForm congresso="uti" congressoNome="III Congresso de UTI" />
        </div>
      </div>
    </div>
  );
}
