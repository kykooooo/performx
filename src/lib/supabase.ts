import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const isTestEnv = process.env.NODE_ENV === "test";
const isBrowser = typeof window !== "undefined";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isTestEnv ? "http://localhost:54321" : undefined);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (isTestEnv ? "test-anon-key" : undefined);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  if (!isSupabaseConfigured) {
    return null;
  }
  // Browser: cookie-based auth so middleware can verify sessions
  // Server/test: standard client (localStorage)
  //
  // Wrapping en try/catch parce que createBrowserClient peut throw sur
  // Safari iOS Private mode (storage indisponible) ou si les cookies
  // sont bloqués. Si ça throw, on retombe sur createClient qui utilise
  // localStorage en best-effort, et si ça throw aussi, on retourne null
  // et le proxy noop prend le relais (mode dégradé mais site accessible).
  try {
    _client = isBrowser && !isTestEnv
      ? createBrowserClient(supabaseUrl!, supabaseAnonKey!)
      : createClient(supabaseUrl!, supabaseAnonKey!);
  } catch (err) {
    console.warn("[supabase] createBrowserClient failed, falling back:", err);
    try {
      _client = createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (err2) {
      console.error("[supabase] createClient also failed:", err2);
      return null;
    }
  }
  return _client;
}

// No-op chainable query builder that returns empty results
const EMPTY_RESULT = { data: null, error: null, count: null };
const noopChain: ProxyHandler<object> = {
  get(_target, prop) {
    // Make it thenable so `await supabase.from(...).select(...)` resolves
    if (prop === "then") {
      return (resolve?: (v: unknown) => void) => {
        if (resolve) resolve(EMPTY_RESULT);
      };
    }
    return (...args: unknown[]) => {
      void args;
      return new Proxy({}, noopChain);
    };
  },
};

const noopAuth = {
  getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
  signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
  signOut: () => Promise.resolve({ error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    if (client) {
      return Reflect.get(client, prop, receiver);
    }
    // Graceful fallback when Supabase is not configured
    if (prop === "auth") return noopAuth;
    if (prop === "from") return () => new Proxy({}, noopChain);
    if (prop === "rpc") return () => Promise.resolve(EMPTY_RESULT);
    return undefined;
  },
});

/**
 * Indique si le Realtime (WebSocket) est utilisable dans ce navigateur.
 *
 * Safari (Mac + iOS) avec le réglage "Empêcher le suivi entre sites" — qui
 * est ACTIVÉ PAR DÉFAUT — bloque les WebSocket vers un domaine tiers
 * (`*.supabase.co`). `new WebSocket()` throw alors SYNCHRONEMENT avec
 * "WebSocket not available: The operation is insecure." lors de
 * `channel.subscribe()` → ce throw remontait jusqu'à l'error boundary et
 * affichait "Une erreur est survenue" sur TOUT le site.
 *
 * On flag l'indisponibilité dès le premier échec pour ne plus jamais
 * retenter (évite les retries en boucle du client Realtime).
 */
let realtimeBlocked = false;

/**
 * Crée + souscrit un channel Realtime de façon sûre. Si le WebSocket est
 * bloqué (Safari ITP) ou si quoi que ce soit throw, retourne `null` et
 * l'appelant continue sans temps réel (le site reste 100% fonctionnel,
 * juste sans mises à jour live — on rafraîchit au mount / au focus à la
 * place). Retourne une fonction de cleanup à appeler au unmount.
 *
 * @param name       nom unique du channel
 * @param configure  reçoit le channel et y attache les listeners `.on(...)`
 *                   AVANT le subscribe. Doit retourner le channel.
 */
export function safeRealtimeSubscribe(
  name: string,
  configure: (channel: RealtimeChannel) => RealtimeChannel,
): () => void {
  if (realtimeBlocked || !isSupabaseConfigured) return () => {};

  const client = getClient();
  if (!client) return () => {};

  let channel: RealtimeChannel | null = null;
  try {
    channel = configure(client.channel(name));
    channel.subscribe((status) => {
      // CHANNEL_ERROR sur Safari quand le WS est refusé : on coupe tout.
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        realtimeBlocked = true;
        if (channel) {
          try {
            client.removeChannel(channel);
          } catch {
            /* ignore */
          }
          channel = null;
        }
      }
    });
  } catch (err) {
    // Throw synchrone de new WebSocket() sur Safari ITP → on désactive.
    realtimeBlocked = true;
    console.warn("[supabase] Realtime indisponible (WebSocket bloqué):", err);
    if (channel) {
      try {
        client.removeChannel(channel);
      } catch {
        /* ignore */
      }
    }
    return () => {};
  }

  return () => {
    if (!channel) return;
    try {
      client.removeChannel(channel);
    } catch {
      /* ignore cleanup errors */
    }
  };
}
