import * as Sentry from "@sentry/nextjs";

// Wrap Sentry init dans try/catch : sur Safari iOS / Private mode, Sentry
// peut throw au boot si localStorage / cookies / fetch sont bloqués. Si on
// laisse ça remonter, le bundle JS plante au chargement et la page ne
// s'hydrate jamais (écran figé). On préfère perdre le monitoring que de
// bloquer tout le site.
try {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    tracesSampleRate: 0.2,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("[Sentry] init failed:", err);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
