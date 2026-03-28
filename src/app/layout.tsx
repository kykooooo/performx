import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import Analytics from "@/components/analytics";
import AuthListener from "@/components/auth-listener";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const siteUrl = SITE_URL;

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let nonce = "";
  try {
    nonce = (await headers()).get("x-nonce") ?? "";
  } catch {
    // headers() unavailable during static generation (e.g. global-error prerender)
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("px-theme");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="px-skip-link">
          Aller au contenu principal
        </a>
        <Analytics nonce={nonce} />
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
