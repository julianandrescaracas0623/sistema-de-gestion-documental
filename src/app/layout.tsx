import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import "./globals.css";
import { Providers } from "@/shared/components/providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IPS | Sistema de Gestion Documental",
  description: "Plataforma interna para gestionar documentos y accesos por rol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${dmSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
