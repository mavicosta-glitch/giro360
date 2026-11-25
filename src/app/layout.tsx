import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-client";
import { SITE_CONFIG } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "Foco Bahia — Notícias da Bahia, Brasil e Mundo em Tempo Real",
    template: "%s | Foco Bahia",
  },
  description:
    "Portal de notícias regional de alta performance com cobertura completa da Bahia, Salvador, agronegócio, economia, esportes, cultura e segurança.",
  keywords: [
    "notícias da Bahia",
    "Salvador",
    "Foco Bahia",
    "jornalismo regional",
    "economia",
    "esportes",
    "agricultura Bahia",
  ],
  authors: [{ name: "Redação Foco Bahia" }],
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    siteName: SITE_CONFIG.name,
    title: "Foco Bahia — Notícias da Bahia, Brasil e Mundo",
    description: SITE_CONFIG.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: "Foco Bahia — Portal de Notícias",
    description: SITE_CONFIG.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-[#263746] antialiased">
        <a href="#conteudo-principal" className="skip-link">
          Ir para o conteúdo principal
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
