import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Virolo – Générateur de boucles moto",
  description: "Génère des itinéraires moto sur mesure, optimisés pour le plaisir de conduire.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
