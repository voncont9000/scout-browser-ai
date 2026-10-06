import { createFileRoute } from "@tanstack/react-router";
import { screenListingWithAstra } from "@/lib/ai/screening.server";

export const Route = createFileRoute("/api/screen-listing")({
  server: { handlers: { POST: async ({ request }) => {
    const body = await request.json() as { title?: string; description?: string; imageUrl?: string };
    if (!body.title || !body.description || !body.imageUrl) return Response.json({ error: "Missing listing fields" }, { status: 400 });
    try { const result = await screenListingWithAstra({ title: body.title, description: body.description, imageUrl: body.imageUrl }, request); const headers = new Headers(); if (result.runId) headers.set("X-Lovable-AIG-Run-ID", result.runId); return Response.json(result, { headers }); }
    catch (error) { const message = error instanceof Error ? error.message : "Screening failed"; return Response.json({ error: message }, { status: 500 }); }
  } } },
});
