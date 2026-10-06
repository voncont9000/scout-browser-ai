import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createRunIdFetch } from "./run-id.server.ts";

const screeningSchema = z.object({
  category: z.string(), subcategory: z.string().nullable(), period: z.string(), secondaryPeriod: z.string().nullable(),
  decadeRange: z.string(), style: z.string(), originCountry: z.string(), attribution: z.string().nullable(),
  materials: z.array(z.string()), conditionNotes: z.string(), reproduction: z.enum(["true", "false", "unsure"]),
  redFlags: z.array(z.string()), resaleLowGbp: z.number(), resaleHighGbp: z.number(),
  periodConfidence: z.number(), valuationConfidence: z.number(), dealerNote: z.string(), isFurniture: z.boolean(),
});

export async function screenListingWithAstra(input: { title: string; description: string; imageUrl: string }, request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Lovable AI is not configured");
  const runIdFetch = createRunIdFetch(request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
  const openai = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  const result = streamText({
    model: openai.responses("openai/gpt-6-astra"),
    instructions: "You are Scout, a conservative antique furniture screening specialist. Classify only from visible and supplied evidence. Keep dealerNote under 25 words. Use confidence values from 0 to 1.",
    messages: [{ role: "user", content: [{ type: "text", text: `Screen this listing. Title: ${input.title}\nDescription: ${input.description}` }, { type: "image", image: new URL(input.imageUrl) }] }],
    output: Output.object({ schema: screeningSchema }),
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  return { output: await result.output, runId: runIdFetch.getRunId() };
}
