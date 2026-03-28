import { isSupabaseConfigured } from "@/lib/supabase";
import type { DataResult, FallbackReason } from "./types";

export function liveResult<T>(data: T): DataResult<T> {
  return { mode: "live", data };
}

export function demoResult<T>(data: T, fallbackReason: FallbackReason): DataResult<T> {
  return { mode: "demo", data, fallbackReason };
}

export function isEmptyArray<T>(value: T[] | null | undefined) {
  return !value || value.length === 0;
}

export async function withPublicFallback<T>(options: {
  loadLive: () => Promise<T>;
  loadDemo: () => T;
  isEmpty?: (value: T) => boolean;
}): Promise<DataResult<T>> {
  if (!isSupabaseConfigured) {
    return demoResult(options.loadDemo(), "missing-config");
  }

  try {
    const data = await options.loadLive();
    if (options.isEmpty?.(data)) {
      return demoResult(options.loadDemo(), "empty-live");
    }
    return liveResult(data);
  } catch {
    return demoResult(options.loadDemo(), "error");
  }
}
