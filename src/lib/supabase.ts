import { createClient } from "@supabase/supabase-js";

const isTestEnv = process.env.NODE_ENV === "test";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isTestEnv ? "http://localhost:54321" : undefined);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (isTestEnv ? "test-anon-key" : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
