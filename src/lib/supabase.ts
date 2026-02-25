import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const isTestEnv = process.env.NODE_ENV === "test";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isTestEnv ? "http://localhost:54321" : undefined);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (isTestEnv ? "test-anon-key" : undefined);

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  _client = createClient(supabaseUrl, supabaseAnonKey);
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
    return (..._args: unknown[]) => new Proxy({}, noopChain);
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
