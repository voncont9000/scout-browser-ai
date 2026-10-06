export type SourceConfig = { actorId: string; input: Record<string, unknown> };
export type NormalizedListing = { title: string; description: string; price: number | null; currency: string | null; listingUrl: string; imageUrls: string[]; raw: unknown };

const gateway = "https://connector-gateway.lovable.dev/apify";

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!lovableKey || !apifyKey) throw new Error("Apify is not connected");
  return { lovableKey, apifyKey };
}

export async function startApifyRun(config: SourceConfig) {
  const { lovableKey, apifyKey } = credentials();
  const response = await fetch(`${gateway}/acts/${config.actorId.replace("/", "~")}/runs`, { method: "POST", headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apifyKey, "Content-Type": "application/json" }, body: JSON.stringify(config.input) });
  const body = await response.json() as { data?: { id?: string }; error?: { message?: string } };
  if (!response.ok || !body.data?.id) throw new Error(body.error?.message ?? `Apify failed with ${response.status}`);
  return body.data.id;
}

export const browserUseFallback = {
  available: false,
  reason: "No browser-use model is currently available in the workspace AI catalogue.",
} as const;
