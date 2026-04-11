import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/booking", "/sessions", "/messages"];

async function checkAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null; // demo mode — skip

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null; // authenticated — continue to security headers
}

export async function proxy(request: NextRequest) {
  // --- Auth gate for protected routes ---
  const authRedirect = await checkAuth(request);
  if (authRedirect) return authRedirect;

  // --- CSP + security headers ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://*.sentry.io https://*.vercel-scripts.com https://plausible.io https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.pexels.com https://images.unsplash.com https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co https://*.sentry.io https://plausible.io https://www.google-analytics.com",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  const { pathname } = request.nextUrl;
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    response.headers.set("Cache-Control", "private, no-store");
  } else if (pathname.startsWith("/auth")) {
    response.headers.set("Cache-Control", "private, no-cache");
  } else {
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
