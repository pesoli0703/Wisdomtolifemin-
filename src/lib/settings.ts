import { cache } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import { defaultSettings } from "./defaults";
import type { AllSettings } from "./types";

/**
 * Loads all site settings from Supabase (per-request cached).
 * Falls back to defaultSettings when Supabase is not configured or
 * unreachable, so every page still renders.
 */
export const getSettings = cache(async (): Promise<AllSettings> => {
  const settings = structuredClone(defaultSettings);
  if (!isSupabaseConfigured) return settings;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("wtlm_settings").select("*");
    if (error || !data) return settings;

    for (const row of data as { key: string; value: unknown }[]) {
      if (row.key in settings && row.value && typeof row.value === "object") {
        // shallow-merge so new keys in defaults are preserved
        (settings as unknown as Record<string, unknown>)[row.key] = {
          ...(settings as unknown as Record<string, Record<string, unknown>>)[row.key],
          ...(row.value as Record<string, unknown>),
        };
      }
    }
  } catch {
    return defaultSettings;
  }
  return settings;
});
