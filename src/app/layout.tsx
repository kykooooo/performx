import type { Metadata } from "next";
import type { ReactNode } from "react";
import Analytics from "@/components/analytics";
import AuthListener from "@/components/auth-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerformX | Coaching Football",
  description: "Plateforme de mise en relation entre joueurs et coachs pour des séances individuelles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Analytics />
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
