import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  periods: z.record(z.enum(["include", "exclude", "neutral"])),
  categories: z.record(z.enum(["include", "exclude", "neutral"])),
  countries: z.record(z.enum(["include", "exclude", "neutral"])),
  sources: z.record(z.enum(["include", "exclude", "neutral"])),
  minPrice: z.number(), maxPrice: z.number(), minMargin: z.number(), hideReproductions: z.boolean(),
});

export const saveScreeningProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error: profileError } = await context.supabase.from("profiles").upsert({ user_id: context.userId, onboarding_complete: true }, { onConflict: "user_id" });
    if (profileError) throw new Error(profileError.message);
    const { error } = await context.supabase.from("screening_profiles").upsert({
      user_id: context.userId, periods: data.periods, categories: data.categories,
      countries: data.countries, sources: data.sources, min_price_gbp: data.minPrice,
      max_price_gbp: data.maxPrice, min_margin_gbp: data.minMargin,
      hide_reproductions: data.hideReproductions, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSwipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ listingId: z.string().uuid(), action: z.enum(["like", "pass", "super_like"]), rankerA: z.number(), rankerB: z.number() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("swipes").upsert({ user_id: context.userId, listing_id: data.listingId, action: data.action, ordered_by: "attribute", ranker_a_score: data.rankerA, ranker_b_score: data.rankerB }, { onConflict: "user_id,listing_id" });
    if (error) throw new Error(error.message);
    if (data.action === "super_like") await context.supabase.from("shortlist").upsert({ user_id: context.userId, listing_id: data.listingId }, { onConflict: "user_id,listing_id" });
    return { ok: true };
  });

export const screenListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ title: z.string(), description: z.string(), imageUrl: z.string().url() }).parse(input))
  .handler(async ({ data }) => {
    const { screenListingWithAstra } = await import("./ai/screening.server");
    const request = new Request("https://scout.local/screen");
    return screenListingWithAstra(data, request);
  });

export const startIngestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ sourceId: z.string().uuid(), query: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("is_admin");
    if (!admin) throw new Error("Admin access required");
    const { data: source, error: sourceError } = await context.supabase.from("sources").select("actor_id,input_template").eq("id", data.sourceId).single();
    if (sourceError || !source?.actor_id) throw new Error(sourceError?.message ?? "Source is not configured");
    const { startApifyRun } = await import("./ingestion.server");
    const runId = await startApifyRun({ actorId: source.actor_id, input: { ...(source.input_template as Record<string, unknown>), searchQuery: data.query } });
    const { data: run, error } = await context.supabase.from("ingestion_runs").insert({ source_id: data.sourceId, search_query: data.query, status: "running", apify_run_id: runId, started_at: new Date().toISOString(), created_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: run.id, providerRunId: runId };
  });
