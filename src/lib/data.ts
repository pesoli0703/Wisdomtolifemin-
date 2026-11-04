import { cache } from "react";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import { defaultMinistries, defaultServiceTimes } from "./defaults";
import type {
  Announcement,
  ChurchEvent,
  GalleryMedia,
  Leader,
  Ministry,
  Sermon,
  ServiceTime,
  Testimony,
} from "./types";

/**
 * All public data reads. Each helper is request-cached and degrades
 * gracefully to empty arrays (or seeded defaults) when Supabase is not
 * configured or a query fails — pages never crash.
 */

export const getServiceTimes = cache(async (): Promise<ServiceTime[]> => {
  if (!isSupabaseConfigured) return defaultServiceTimes;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_service_times")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data) return defaultServiceTimes;
    return data as ServiceTime[];
  } catch {
    return defaultServiceTimes;
  }
});

export const getMinistries = cache(async (): Promise<Ministry[]> => {
  if (!isSupabaseConfigured) return defaultMinistries;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_ministries")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data) return defaultMinistries;
    return data as Ministry[];
  } catch {
    return defaultMinistries;
  }
});

export const getMinistryBySlug = cache(
  async (slug: string): Promise<Ministry | null> => {
    if (!isSupabaseConfigured)
      return defaultMinistries.find((m) => m.slug === slug) ?? null;
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wtlm_ministries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return null;
      return data as Ministry;
    } catch {
      return null;
    }
  }
);

export const getUpcomingEvents = cache(
  async (limit = 6): Promise<ChurchEvent[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wtlm_events")
        .select("*")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(limit);
      if (error || !data) return [];
      return data as ChurchEvent[];
    } catch {
      return [];
    }
  }
);

export const getAllEvents = cache(async (): Promise<ChurchEvent[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_events")
      .select("*")
      .order("start_at", { ascending: false });
    if (error || !data) return [];
    return data as ChurchEvent[];
  } catch {
    return [];
  }
});

export const getEventBySlug = cache(
  async (slug: string): Promise<ChurchEvent | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wtlm_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return null;
      return data as ChurchEvent;
    } catch {
      return null;
    }
  }
);

export const getSermons = cache(async (): Promise<Sermon[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_sermons")
      .select("*")
      .order("sermon_date", { ascending: false });
    if (error || !data) return [];
    return data as Sermon[];
  } catch {
    return [];
  }
});

export const getSermonBySlug = cache(
  async (slug: string): Promise<Sermon | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wtlm_sermons")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data) return null;
      return data as Sermon;
    } catch {
      return null;
    }
  }
);

export const getLatestSermons = cache(async (limit = 3): Promise<Sermon[]> => {
  const all = await getSermons();
  return all.slice(0, limit);
});

export const getTestimonies = cache(async (): Promise<Testimony[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_testimonies")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as Testimony[];
  } catch {
    return [];
  }
});

export const getGalleryMedia = cache(async (): Promise<GalleryMedia[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_gallery_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data as GalleryMedia[];
  } catch {
    return [];
  }
});

export const getLeaders = cache(async (): Promise<Leader[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wtlm_leaders")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as Leader[];
  } catch {
    return [];
  }
});

export const getActiveAnnouncements = cache(
  async (): Promise<Announcement[]> => {
    if (!isSupabaseConfigured) return [];
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("wtlm_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      // RLS already filters active + published for anonymous visitors,
      // but filter again for admin sessions that see everything.
      const now = Date.now();
      return (data as Announcement[]).filter(
        (a) =>
          a.published &&
          new Date(a.starts_at).getTime() <= now &&
          (!a.ends_at || new Date(a.ends_at).getTime() >= now)
      );
    } catch {
      return [];
    }
  }
);
