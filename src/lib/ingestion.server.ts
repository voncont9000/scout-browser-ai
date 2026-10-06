const gateway = "https://connector-gateway.lovable.dev/apify";

function headers() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!lovableKey || !apifyKey) throw new Error("The marketplace scraping service is not connected");
  return { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": apifyKey, "Content-Type": "application/json" };
}

async function call<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${gateway}${path}`, { ...init, headers: headers() });
  const body = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Scraper request failed (${response.status})`);
  return body;
}

export async function startApifyRun(actorId: string, input: Record<string, unknown>) {
  const body = await call<{ data?: { id?: string } }>(`/acts/${actorId.replace("/", "~")}/runs?timeout=240`, { method: "POST", body: JSON.stringify(input) });
  if (!body.data?.id) throw new Error("Scraper did not return a run id");
  return body.data.id;
}

export async function getApifyRun(runId: string) {
  const body = await call<{ data?: { status?: string; defaultDatasetId?: string } }>(`/actor-runs/${runId}`);
  return { status: body.data?.status ?? "UNKNOWN", datasetId: body.data?.defaultDatasetId ?? null };
}

export async function getApifyItems(datasetId: string, limit: number) {
  const response = await fetch(`${gateway}/datasets/${datasetId}/items?clean=true&limit=${limit}`, { headers: headers() });
  if (!response.ok) throw new Error(`Could not read scraper results (${response.status})`);
  const items = (await response.json()) as unknown;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

export const browserUseFallback = {
  available: false,
  reason: "No browser-use model is currently available in the workspace AI catalogue.",
} as const;
