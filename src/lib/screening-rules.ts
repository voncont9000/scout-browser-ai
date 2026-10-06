// Pure screening rules shared by the tagging job and the per-dealer feed.
// The AI tags a listing once; each dealer's profile is applied to stored tags,
// so changing the profile re-screens instantly without new AI calls.

export type Tri = "include" | "exclude" | "neutral";
export type TriMap = Record<string, Tri>;

const junk = [
  "wanted", "recherche", "cherche", "suche", "busco", "cerco", "gezocht", "spare parts", "pièces détachées", "ersatzteile",
  "flat pack", "flat-pack", "ikea", "neuf sous emballage", "neu ovp", "nuevo a estrenar", "nuovo imballato",
];

// Generic text screen applied before any AI spend.
export function textScreen(listing: { title: string; description: string | null; image_urls: string[]; price: number | null }) {
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();
  if (!listing.image_urls.length) return "No photo";
  const hit = junk.find((term) => text.includes(term));
  if (hit) return `Text screen: “${hit}”`;
  if (listing.price === null || listing.price <= 0) return "No asking price";
  return null;
}

export type Tags = {
  category: string; period: string; secondary_period: string | null; period_confidence: number | null;
  is_reproduction: string; is_furniture: boolean;
};

export type Decision = { status: "passed" | "maybe" | "rejected"; reason: string | null };

export function decide(
  tags: Tags,
  listing: { title: string; description: string | null; price_gbp: number | null; source: string },
  profile: { periods: TriMap; categories: TriMap; sources: TriMap; min_price_gbp: number | null; max_price_gbp: number | null; hide_reproductions: boolean },
  excludedTerms: string[],
): Decision {
  if (!tags.is_furniture) return { status: "rejected", reason: "Not furniture" };
  if (profile.sources[listing.source] === "exclude") return { status: "rejected", reason: `Source excluded: ${listing.source}` };
  const price = listing.price_gbp;
  if (price !== null && profile.min_price_gbp !== null && price < profile.min_price_gbp) return { status: "rejected", reason: "Below price range" };
  if (price !== null && profile.max_price_gbp !== null && price > profile.max_price_gbp) return { status: "rejected", reason: "Above price range" };
  const text = `${listing.title} ${listing.description ?? ""}`.toLowerCase();
  const term = excludedTerms.find((t) => t && text.includes(t.toLowerCase()));
  if (term) return { status: "rejected", reason: `Excluded term “${term}”` };
  if (profile.hide_reproductions && tags.is_reproduction === "true") return { status: "rejected", reason: "Reproduction" };

  const confident = (tags.period_confidence ?? 0) > 0.6;
  const periodPref = profile.periods[tags.period] ?? "neutral";
  const categoryPref = profile.categories[tags.category] ?? "neutral";
  if (confident && periodPref === "exclude") return { status: "rejected", reason: `Excluded period: ${tags.period}` };
  if (categoryPref === "exclude") return { status: "rejected", reason: `Excluded category: ${tags.category}` };

  const anyPeriodIncluded = Object.values(profile.periods).includes("include");
  const anyCategoryIncluded = Object.values(profile.categories).includes("include");
  const periodOk = periodPref === "include" || (!anyPeriodIncluded && periodPref === "neutral");
  const categoryOk = categoryPref === "include" || (!anyCategoryIncluded && categoryPref === "neutral");
  if (confident && periodOk && categoryOk) return { status: "passed", reason: null };
  if (!periodOk && confident) return { status: "rejected", reason: `Outside your periods: ${tags.period}` };
  return { status: "maybe", reason: !confident ? "Period uncertain" : "Category outside your picks" };
}

// Bargain score per spec: midpoint resale minus price, scaled by valuation confidence.
export function bargain(input: { low: number | null; high: number | null; priceGbp: number | null; kind: string; auctionEnd: string | null; valuationConfidence: number | null }) {
  if (input.low === null || input.high === null || input.priceGbp === null || input.priceGbp <= 0) return null;
  if (input.kind === "offer") return null;
  if (input.kind === "current_bid") {
    if (!input.auctionEnd || new Date(input.auctionEnd).getTime() - Date.now() > 24 * 3600_000) return null;
  }
  const raw = (input.low + input.high) / 2 - input.priceGbp;
  const scaled = Math.round(raw * (input.valuationConfidence ?? 0));
  return { gbp: scaled, percent: Math.round((scaled / input.priceGbp) * 100) };
}
