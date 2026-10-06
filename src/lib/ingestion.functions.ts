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

    await supabaseAdmin.from("job_state").update({ status: "completed", pause_reason: null }).eq("job_name", "screening").eq("status", "paused");
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

const SCREEN_BATCH = 3;

// Tags pending listings with the AI, a few at a time. A database lease stops two
// tabs screening the same listings; AI credit/access blocks pause the job until
// the dealer explicitly starts a new fetch.
export const runScreeningBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { textScreen } = await import("./screening-rules");
    const { screenListingWithAstra, AiBlockedError } = await import("./ai/screening.server");
    const now = new Date();
    const { data: job } = await supabaseAdmin.from("job_state").select("status,lease_until,pause_reason").eq("job_name", "screening").maybeSingle();
    if (job?.status === "paused") return { screened: 0, remaining: -1, paused: job.pause_reason ?? "AI paused" };
    if (job?.lease_until && new Date(job.lease_until) > now) return { screened: 0, remaining: -1, paused: null, busy: true };
    const lease = new Date(now.getTime() + 120_000).toISOString();
    if (job) {
      const { data: claimed } = await supabaseAdmin.from("job_state").update({ status: "running", lease_until: lease, updated_at: now.toISOString() }).eq("job_name", "screening").or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`).select("job_name");
      if (!claimed?.length) return { screened: 0, remaining: -1, paused: null, busy: true };
    } else {
      const { error } = await supabaseAdmin.from("job_state").insert({ job_name: "screening", status: "running", lease_until: lease });
      if (error) return { screened: 0, remaining: -1, paused: null, busy: true };
    }

    let screened = 0;
    let paused: string | null = null;
    try {
      const { data: pending } = await supabaseAdmin.from("listings").select("id,title,description,image_urls,price,currency").eq("screening_status", "pending").order("created_at").limit(SCREEN_BATCH * 3);
      const toAi: NonNullable<typeof pending> = [];
      for (const listing of pending ?? []) {
        const reason = textScreen(listing);
        if (reason) { await supabaseAdmin.from("listings").update({ screening_status: "rejected_text", rejection_reason: reason }).eq("id", listing.id).eq("screening_status", "pending"); screened++; }
        else if (toAi.length < SCREEN_BATCH) toAi.push(listing);
      }
      const results = await Promise.allSettled(toAi.map(async (listing) => {
        const tags = await screenListingWithAstra({ title: listing.title, description: listing.description ?? "", imageUrl: listing.image_urls[0]!, priceText: `${listing.price} ${listing.currency ?? ""}` });
        const { error } = await supabaseAdmin.from("listing_tags").upsert({
          listing_id: listing.id, category: tags.category, subcategory: tags.subcategory, period: tags.period, secondary_period: tags.secondaryPeriod,
          decade_range: tags.decadeRange, style: tags.style, origin_country: tags.originCountry, attribution: tags.attribution, materials: tags.materials,
          condition_notes: tags.conditionNotes, is_reproduction: tags.reproduction, red_flags: tags.redFlags.slice(0, 4),
          resale_low_gbp: tags.resaleLowGbp, resale_high_gbp: tags.resaleHighGbp, period_confidence: tags.periodConfidence,
          valuation_confidence: tags.valuationConfidence, dealer_note: tags.dealerNote, is_furniture: tags.isFurniture, model_id: "openai/gpt-6-astra",
        }, { onConflict: "listing_id" });
        if (error) throw new Error(error.message);
        await supabaseAdmin.from("listings").update(tags.isFurniture ? { screening_status: "passed", rejection_reason: null } : { screening_status: "rejected_vision", rejection_reason: "Not furniture" }).eq("id", listing.id);
      }));
      for (const [i, r] of results.entries()) {
        if (r.status === "fulfilled") { screened++; continue; }
        if (r.reason instanceof AiBlockedError) { paused = r.reason.status === 402 ? "AI credits have run out. Top up in Settings → Plans & credits, then fetch again." : `AI access blocked: ${r.reason.message}`; continue; }
        // Unreadable image or similar per-item failure: send to Maybe so it never loops.
        const listing = toAi[i]!;
        console.error("screening failed", listing.id, r.reason);
        await supabaseAdmin.from("listings").update({ screening_status: "maybe", rejection_reason: "AI could not read this listing" }).eq("id", listing.id).eq("screening_status", "pending");
        screened++;
      }
    } finally {
      await supabaseAdmin.from("job_state").update(paused ? { status: "paused", pause_reason: paused, lease_until: null } : { status: "completed", lease_until: null }).eq("job_name", "screening");
    }
    const { count } = await supabaseAdmin.from("listings").select("id", { count: "exact", head: true }).eq("screening_status", "pending");
    return { screened, remaining: count ?? 0, paused };
  });

export type LiveListing = {
  id: string; title: string; url: string; source: string; country: string; location: string | null;
  image: string | null; images: string[]; price: number | null; currency: string | null; priceGbp: number | null;
  priceKind: "fixed" | "offer" | "current_bid"; auctionEnd: string | null; description: string | null;
  decision: "pending" | "passed" | "maybe"; reason: string | null;
  tags: null | { category: string; period: string; style: string | null; resaleLow: number | null; resaleHigh: number | null; periodConfidence: number | null; note: string | null; redFlags: string[]; reproduction: string };
  margin: null | { gbp: number; percent: number };
};

// Applies the dealer's own profile to stored AI tags on every read, so profile edits re-screen instantly.
export const getLiveListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LiveListing[]> => {
    const { decide, bargain } = await import("./screening-rules");
    const [{ data: profile }, { data, error }, { data: terms }] = await Promise.all([
      context.supabase.from("screening_profiles").select("periods,categories,sources,min_price_gbp,max_price_gbp,hide_reproductions").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("listings")
        .select("id,title,listing_url,country,location,image_urls,price,currency,price_gbp,price_kind,auction_end_time,screening_status,description,sources(name),listing_tags(*)")
        .in("screening_status", ["pending", "passed", "maybe"]).order("created_at", { ascending: false }).limit(150),
      context.supabase.from("period_terms").select("period_name,terms"),
    ]);
    if (error) throw new Error(error.message);
    const prefs = {
      periods: (profile?.periods ?? {}) as Record<string, "include" | "exclude" | "neutral">,
      categories: (profile?.categories ?? {}) as Record<string, "include" | "exclude" | "neutral">,
      sources: (profile?.sources ?? {}) as Record<string, "include" | "exclude" | "neutral">,
      min_price_gbp: profile?.min_price_gbp ?? null, max_price_gbp: profile?.max_price_gbp ?? null, hide_reproductions: profile?.hide_reproductions ?? true,
    };
    const excludedTerms = (terms ?? []).filter((t) => prefs.periods[t.period_name] === "exclude").flatMap((t) => t.terms);
    const out: LiveListing[] = [];
    for (const row of data ?? []) {
      const source = (row.sources as { name: string } | null)?.name ?? "Marketplace";
      const tagRow = (Array.isArray(row.listing_tags) ? row.listing_tags[0] : row.listing_tags) as null | {
        category: string; subcategory: string | null; period: string; secondary_period: string | null; period_confidence: number | null; is_reproduction: string; is_furniture: boolean;
        style: string | null; resale_low_gbp: number | null; resale_high_gbp: number | null; valuation_confidence: number | null; dealer_note: string | null; red_flags: string[];
      };
      let decision: LiveListing["decision"] = row.screening_status === "maybe" ? "maybe" : "pending";
      let reason: string | null = null;
      if (tagRow) {
        const d = decide(tagRow, { title: row.title, description: row.description, price_gbp: row.price_gbp, source }, prefs, excludedTerms);
        if (d.status === "rejected") continue;
        decision = d.status;
        reason = d.reason;
      } else if (prefs.sources[source] === "exclude") continue;
      out.push({
        id: row.id, title: row.title, url: row.listing_url, source, country: row.country, location: row.location,
        image: row.image_urls[0] ?? null, images: row.image_urls, price: row.price, currency: row.currency, priceGbp: row.price_gbp,
        priceKind: row.price_kind, auctionEnd: row.auction_end_time, description: row.description, decision, reason,
        tags: tagRow ? { category: tagRow.category, period: tagRow.period, style: tagRow.style, resaleLow: tagRow.resale_low_gbp, resaleHigh: tagRow.resale_high_gbp, periodConfidence: tagRow.period_confidence, note: tagRow.dealer_note, redFlags: tagRow.red_flags, reproduction: tagRow.is_reproduction } : null,
        margin: tagRow ? bargain({ low: tagRow.resale_low_gbp, high: tagRow.resale_high_gbp, priceGbp: row.price_gbp, kind: row.price_kind, auctionEnd: row.auction_end_time, valuationConfidence: tagRow.valuation_confidence }) : null,
      });
    }
    return out;
  });
