import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-client";
import { SITE_CONFIG } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "BA Infoco — Notícias da Bahia, Brasil e Mundo em Tempo Real",
    template: "%s | BA Infoco",
  },
  description:
    "Portal de notícias regional de alta performance com cobertura completa da Bahia, Salvador, agronegócio, economia, esportes, cultura e segurança.",
  keywords: [
    "notícias da Bahia",
    "Salvador",
    "BA Infoco",
    "jornalismo regional",
    "economia",
    "esportes",
    "agricultura Bahia",
  ],
  authors: [{ name: "Redação BA Infoco" }],
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    siteName: SITE_CONFIG.name,
    title: "BA Infoco — Notícias da Bahia, Brasil e Mundo",
    description: SITE_CONFIG.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: "BA Infoco — Portal de Notícias",
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
