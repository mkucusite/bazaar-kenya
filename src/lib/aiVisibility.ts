import { supabase } from "@/integrations/supabase/client";

/**
 * Controls whether auto-generated (seed/AI) content is shown on the public site.
 * Hidden content stays in the database and keeps its own indexable detail page —
 * it is only removed from browse/listing surfaces so visitors only meet real,
 * human-published listings. Admins can flip these switches back on.
 */
export const AI_VISIBILITY_KEYS = {
  directory: "hide_ai_directory",
  ads: "hide_ai_ads",
} as const;

const CACHE_KEY = "ka_ai_visibility";

type VisibilityState = { directory: boolean; ads: boolean };

const DEFAULTS: VisibilityState = { directory: true, ads: true };

const readCache = (): VisibilityState => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<VisibilityState>;
    return {
      directory: parsed.directory ?? DEFAULTS.directory,
      ads: parsed.ads ?? DEFAULTS.ads,
    };
  } catch {
    return DEFAULTS;
  }
};

let state: VisibilityState = readCache();
let inflight: Promise<VisibilityState> | null = null;

export const aiHidden = (): VisibilityState => state;

export const loadAiVisibility = (force = false): Promise<VisibilityState> => {
  if (force) inflight = null;
  if (!inflight) {
    inflight = (async () => {
      const { data } = await (supabase.from("admin_settings" as any) as any)
        .select("key,value")
        .in("key", [AI_VISIBILITY_KEYS.directory, AI_VISIBILITY_KEYS.ads]);
      const map = new Map<string, string>(((data as any[]) || []).map((r) => [r.key, r.value]));
      const next: VisibilityState = {
        directory: (map.get(AI_VISIBILITY_KEYS.directory) ?? "true") !== "false",
        ads: (map.get(AI_VISIBILITY_KEYS.ads) ?? "true") !== "false",
      };
      state = next;
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    })();
  }
  return inflight;
};

/**
 * PostgREST `.or()` fragments. When hiding is off they match everything,
 * so the same chain works for both states without extra branching.
 */
export const adVisibilityOr = () =>
  state.ads ? "ai_generated.eq.false,ai_generated.is.null" : "ai_generated.eq.false,ai_generated.eq.true,ai_generated.is.null";

export const directoryVisibilityOr = () =>
  state.directory ? "is_manual.eq.true" : "is_manual.eq.true,is_manual.eq.false,is_manual.is.null";

// Warm the cache as soon as the app boots.
if (typeof window !== "undefined") void loadAiVisibility();
