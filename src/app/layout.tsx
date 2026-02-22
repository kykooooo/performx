import type { Metadata } from "next";
import type { ReactNode } from "react";
import Analytics from "@/components/analytics";
import AuthListener from "@/components/auth-listener";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://performx.fr";

export const metadata: Metadata = {
  title: {
    default: "PerformX | Coaching Football Individuel",
    template: "%s | PerformX",
  },
  description:
    "Plateforme de mise en relation entre joueurs et coachs pour des séances individuelles de football. Réserve ta séance en quelques clics.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "PerformX",
    title: "PerformX | Coaching Football Individuel",
    description:
      "Trouve ton coach, réserve une séance privée et progresse rapidement grâce au coaching individuel.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "PerformX | Coaching Football Individuel",
    description:
      "Trouve ton coach, réserve une séance privée et progresse rapidement grâce au coaching individuel.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <a href="#main-content" className="px-skip-link">
          Aller au contenu principal
        </a>
        <Analytics />
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
