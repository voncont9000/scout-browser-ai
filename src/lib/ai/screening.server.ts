import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { createRunIdFetch } from "./run-id.server.ts";
import { categories, periods } from "../taxonomy";

const screeningSchema = z.object({
  isFurniture: z.boolean(),
  category: z.string(), subcategory: z.string().nullable(), period: z.string(), secondaryPeriod: z.string().nullable(),
  decadeRange: z.string(), style: z.string(), originCountry: z.string(), attribution: z.string().nullable(),
  materials: z.array(z.string()), conditionNotes: z.string(), reproduction: z.enum(["true", "false", "unsure"]),
  redFlags: z.array(z.string()), resaleLowGbp: z.number(), resaleHighGbp: z.number(),
  periodConfidence: z.number(), valuationConfidence: z.number(), dealerNote: z.string(),
});
export type ScreeningOutput = z.infer<typeof screeningSchema>;

export class AiBlockedError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const system = `You are Scout, a conservative antique and vintage furniture specialist screening marketplace listings for a UK dealer.
Classify only from the photo and supplied text. Listings may be in French, Spanish, German, Italian or Dutch.
category must be exactly one of: ${categories.join(", ")}, Other.
period and secondaryPeriod must be exactly one of: ${periods.join(", ")}, Unknown (secondaryPeriod may be null).
reproduction is "true" for reproductions, modern copies or "in the style of" pieces; "unsure" when you cannot tell.
resaleLowGbp/resaleHighGbp: realistic UK trade resale range in GBP after light cleaning. Use 0 for both if not furniture.
periodConfidence and valuationConfidence are 0 to 1. dealerNote is under 25 words. Keep redFlags short (max 4).`;

export async function screenListingWithAstra(input: { title: string; description: string; imageUrl: string; priceText: string }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiBlockedError("AI is not configured", 401);
  const runIdFetch = createRunIdFetch(undefined);
  const openai = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  try {
    const result = streamText({
      model: openai.responses("openai/gpt-6-astra"),
      system,
      messages: [{ role: "user", content: [
        { type: "text", text: `Title: ${input.title}\nAsking price: ${input.priceText}\nDescription: ${input.description.slice(0, 2500)}` },
        { type: "file", data: new URL(input.imageUrl), mediaType: "image/jpeg" },
      ] }],
      output: Output.object({ schema: screeningSchema }),
      providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
    });
    const output = await result.output;
    return {
      ...output,
      category: categories.includes(output.category) ? output.category : "Other",
      period: periods.includes(output.period) ? output.period : "Unknown",
      secondaryPeriod: output.secondaryPeriod && periods.includes(output.secondaryPeriod) ? output.secondaryPeriod : null,
      periodConfidence: Math.min(1, Math.max(0, output.periodConfidence)),
      valuationConfidence: Math.min(1, Math.max(0, output.valuationConfidence)),
    };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 401 || status === 402 || status === 403) throw new AiBlockedError((error as Error).message || "AI access blocked", status);
    throw error;
  }
}
