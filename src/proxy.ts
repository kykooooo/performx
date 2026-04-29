import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/booking", "/sessions", "/messages"];

/**
 * Proxy Next.js 16 (middleware) :
 *   1. Prépare un unique `response` qui sera enrichi par :
 *      - les cookies refresh Supabase (si token expire pendant getUser)
 *      - les headers de sécurité (CSP, HSTS, etc.)
 *   2. Vérifie l'auth pour les routes protégées.
 *   3. Retourne le même `response` à la fin (avec cookies + headers).
 *
 * IMPORTANT : on ne crée qu'UN SEUL NextResponse.next() par requête et on
 * le ré-attribue dans le callback `setAll`. Bug précédent : la fonction
 * checkAuth créait son propre response et le perdait en retournant null,
 * écrasé par un second NextResponse.next() dans proxy(). Sur Safari iOS,
 * cela effaçait les cookies de session refresh → boucle /auth/login.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // 1. Nonce CSP + headers de requête (le x-nonce est lu par les Server
  //    Components via headers()).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // 2. Response unique, re-créé par Supabase quand il refresh les cookies.
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // 3. Auth Supabase : validation + refresh éventuel des cookies dans response.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { id: string } | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Ré-assigne response avec request mis à jour, puis copie les cookies.
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // getUser() déclenche setAll() si la session doit être refresh.
    // Tourne sur TOUTES les routes (pas seulement protégées) pour garder
    // la session à jour partout — /auth/login inclus, ce qui évite que
    // Safari "oublie" la session entre un login et sa redirection.
    // Wrapping dans try/catch : si Supabase est down ou si un cookie est
    // malformé, on ne plante pas la requête entière (sinon 500 → page
    // d'erreur générique côté client). On laisse passer en non-auth.
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user ? { id: data.user.id } : null;
    } catch (err) {
      console.warn("[proxy] supabase.auth.getUser failed:", err);
      user = null;
    }
  }

  // 4. Auth gate pour les routes protégées.
  if (isProtected && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Headers de sécurité ajoutés au response final (qui a potentiellement
  //    les cookies refresh). Si on recréait le response ici, on perdrait
  //    les cookies → re-boucle sur Safari. D'où set direct sur response.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://*.sentry.io https://*.vercel-scripts.com https://plausible.io https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co https://*.sentry.io https://plausible.io https://www.google-analytics.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  if (isProtected) {
    response.headers.set("Cache-Control", "private, no-store");
  } else if (pathname.startsWith("/auth")) {
    response.headers.set("Cache-Control", "private, no-cache");
  } else {
    response.headers.set(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
