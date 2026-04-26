import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/shared/components/providers";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
