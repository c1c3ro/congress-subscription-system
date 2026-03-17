import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmação - III Congresso de UTI",
  description: "Confirme sua presença e escolha seus workshops no III Congresso de Terapia Intensiva.",
  openGraph: {
    title: "Confirme sua Presença no III Congresso de UTI",
    description: "Finalize sua inscrição e escolha seus workshops favoritos",
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

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
