import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QUERIES_PER_SOURCE = 2;
const ITEMS_PER_RUN = 20;
const COOLDOWN_HOURS = 6;
const MAX_SYNC_RUNS = 8;

type TriMap = Record<string, "include" | "exclude" | "neutral">;
const included = (map: unknown) => Object.entries((map ?? {}) as TriMap).filter(([, v]) => v === "include").map(([k]) => k);

// Starts bounded scraper runs for the signed-in dealer's profile. Re-running within the
// cooldown reuses existing runs for the same source + query instead of paying twice.
export const requestFreshListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase.from("screening_profiles").select("periods,categories,sources").eq("user_id", context.userId).maybeSingle();
    if (!profile) throw new Error("Save your screening profile first");
    const { adapters, buildQueries } = await import("./marketplace-adapters.server");
    const { startApifyRun } = await import("./ingestion.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sourcePrefs = (profile.sources ?? {}) as TriMap;
    const { data: sources, error } = await supabaseAdmin.from("sources").select("id,name,actor_id,input_template,enabled").eq("enabled", true).in("name", Object.keys(adapters));
    if (error) throw new Error(error.message);
    const { data: terms } = await supabaseAdmin.from("period_terms").select("period_name,language_code,terms");
    const termMap = new Map((terms ?? []).map((t) => [`${t.period_name}|${t.language_code}`, t.terms[0] ?? t.period_name]));

    const since = new Date(Date.now() - COOLDOWN_HOURS * 3600_000).toISOString();
    let started = 0;
    let reused = 0;
    const failures: string[] = [];
    for (const source of sources ?? []) {
      const adapter = adapters[source.name];
      if (!adapter || !source.actor_id || sourcePrefs[source.name] === "exclude") continue;
      for (const query of buildQueries(adapter, included(profile.periods), included(profile.categories), termMap, QUERIES_PER_SOURCE)) {
        const { data: recent } = await supabaseAdmin.from("ingestion_runs").select("id").eq("source_id", source.id).eq("search_query", query).neq("status", "failed").gte("created_at", since).limit(1);
        if (recent?.length) { reused++; continue; }
        const { data: run, error: runError } = await supabaseAdmin.from("ingestion_runs").insert({ source_id: source.id, search_query: query, status: "queued", created_by: context.userId }).select("id").single();
        if (runError || !run) { failures.push(source.name); continue; }
        try {
          const input = { ...((source.input_template ?? {}) as Record<string, unknown>), ...adapter.buildInput(query, ITEMS_PER_RUN) };
          const providerRunId = await startApifyRun(source.actor_id, input);
          await supabaseAdmin.from("ingestion_runs").update({ status: "running", apify_run_id: providerRunId, started_at: new Date().toISOString() }).eq("id", run.id);
          started++;
        } catch (e) {
          await supabaseAdmin.from("ingestion_runs").update({ status: "failed", error_message: e instanceof Error ? e.message : "Start failed", finished_at: new Date().toISOString() }).eq("id", run.id);
          failures.push(source.name);
        }
      }
    }
    return { started, reused, failures };
  });

// Collects finished scraper runs, normalizes items through the adapters and stores them.
// Safe to call repeatedly: listings are deduplicated on their URL and completed runs are skipped.
export const collectFinishedRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { adapters, toGbp } = await import("./marketplace-adapters.server");
    const { getApifyRun, getApifyItems } = await import("./ingestion.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: runs } = await supabaseAdmin.from("ingestion_runs").select("id,apify_run_id,source_id,sources(name)").eq("status", "running").order("started_at").limit(MAX_SYNC_RUNS);
    let imported = 0;
    let stillRunning = 0;
    for (const run of runs ?? []) {
      const name = (run.sources as { name: string } | null)?.name ?? "";
      const adapter = adapters[name];
      if (!run.apify_run_id || !adapter) continue;
      try {
        const status = await getApifyRun(run.apify_run_id);
        if (status.status === "READY" || status.status === "RUNNING") { stillRunning++; continue; }
        if (status.status !== "SUCCEEDED" || !status.datasetId) {
          await supabaseAdmin.from("ingestion_runs").update({ status: "failed", error_message: `Scraper ended with ${status.status}`, finished_at: new Date().toISOString() }).eq("id", run.id).eq("status", "running");
          continue;
        }
        const items = await getApifyItems(status.datasetId, ITEMS_PER_RUN);
        const rows = items.map((item) => ({ item, n: adapter.normalize(item) })).filter((r) => r.n !== null).map(({ item, n }) => ({
          source_id: run.source_id, ingestion_run_id: run.id, listing_url: n!.listingUrl, title: n!.title, description: n!.description,
          price: n!.price, currency: n!.currency, price_gbp: toGbp(n!.price, n!.currency), price_kind: n!.priceKind,
          auction_end_time: n!.auctionEndTime, image_urls: n!.imageUrls, location: n!.location, seller_type: n!.sellerType,
          posted_date: n!.postedDate, country: n!.country, raw_json: item as never, screening_status: "pending" as const,
        }));
        let inserted = 0;
        if (rows.length) {
          const { data, error } = await supabaseAdmin.from("listings").upsert(rows, { onConflict: "listing_url", ignoreDuplicates: true }).select("id");
          if (error) throw new Error(error.message);
          inserted = data?.length ?? 0;
        }
        imported += inserted;
        await supabaseAdmin.from("ingestion_runs").update({ status: "completed", items_found: items.length, items_imported: inserted, finished_at: new Date().toISOString() }).eq("id", run.id).eq("status", "running");
      } catch (e) {
        await supabaseAdmin.from("ingestion_runs").update({ status: "failed", error_message: e instanceof Error ? e.message : "Collect failed", finished_at: new Date().toISOString() }).eq("id", run.id).eq("status", "running");
      }
    }
    return { imported, stillRunning };
  });

export type LiveListing = {
  id: string; title: string; url: string; source: string; country: string; location: string | null;
  image: string | null; images: string[]; price: number | null; currency: string | null; priceGbp: number | null;
  priceKind: "fixed" | "offer" | "current_bid"; auctionEnd: string | null; status: string; description: string | null;
};

export const getLiveListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LiveListing[]> => {
    const { data, error } = await context.supabase.from("listings")
      .select("id,title,listing_url,country,location,image_urls,price,currency,price_gbp,price_kind,auction_end_time,screening_status,description,sources(name)")
      .in("screening_status", ["pending", "passed", "maybe"]).order("created_at", { ascending: false }).limit(80);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id, title: row.title, url: row.listing_url, source: (row.sources as { name: string } | null)?.name ?? "Marketplace",
      country: row.country, location: row.location, image: row.image_urls[0] ?? null, images: row.image_urls,
      price: row.price, currency: row.currency, priceGbp: row.price_gbp, priceKind: row.price_kind,
      auctionEnd: row.auction_end_time, status: row.screening_status, description: row.description,
    }));
  });
