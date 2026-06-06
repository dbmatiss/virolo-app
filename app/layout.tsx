import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Virolo – Boucles moto sur mesure",
  description: "Génère des itinéraires moto optimisés pour le plaisir de conduire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full ${inter.variable}`}>
      <body className="h-full bg-zinc-950 text-white antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
