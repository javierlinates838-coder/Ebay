import { generateObject, generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ProductAnalysis } from "@/types";

const MAX_PHOTOS = 3;

const productAnalysisSchema = z.object({
  product: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  condition: z.string(),
  category: z.string(),
  confidence: z.number(),
  itemSpecifics: z.record(z.string(), z.string()),
  identificationNotes: z.string(),
  conditionNotes: z.string(),
  searchQuery: z.string(),
  visibleText: z.array(z.string()),
});

const VISION_PROMPT = `You are an expert eBay reseller identifying a product from photos.

Look at every photo. Identify the item for an eBay listing.

Rules:
- Be SPECIFIC: "Nike Alpha Huarache Elite 4 Metal Baseball Cleats" not "shoes"
- Brand from visible logos/tags (Nike swoosh = Nike)
- Include all colors in the colorway
- Condition: New, Like New, Good, Fair, or Poor
- Quote text you read from tags in visibleText
- searchQuery: best eBay sold-comp search (brand + product type + color)
- confidence 85+ when brand logo AND product type are obvious

Respond with ONLY valid JSON (no markdown):
{"product":"","brand":"","model":"","color":"","condition":"Good","category":"","confidence":85,"itemSpecifics":{},"identificationNotes":"","conditionNotes":"","searchQuery":"","visibleText":[]}`;

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
}

function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getAnalysisModels(): string[] {
  const primary =
    process.env.GEMINI_VISION_MODEL?.trim() ||
    process.env.GEMINI_ANALYSIS_MODEL?.trim() ||
    "gemini-2.5-flash";
  return [primary, "gemini-2.5-flash", "gemini-2.0-flash"].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );
}

function getModel(modelName: string): LanguageModel {
  if (isGeminiConfigured()) {
    return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() })(modelName);
  }
  if (isOpenAIConfigured()) {
    return openai("gpt-4o");
  }
  throw new Error("No AI provider configured");
}

function geminiOptions() {
  return isGeminiConfigured()
    ? { providerOptions: { google: { structuredOutputs: false } } }
    : {};
}

function toVisionContent(imageUrls: string[]) {
  return [
    { type: "text" as const, text: `${imageUrls.length} product photo(s):` },
    ...imageUrls.map((url) => {
      const match = url.match(/^data:(image\/[^;]+);base64,/);
      return {
        type: "image" as const,
        image: url,
        ...(match ? { mimeType: match[1] } : {}),
      };
    }),
  ];
}

function normalizeCondition(raw: string): ProductAnalysis["condition"] {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("like new")) return "Like New";
  if (lower.includes("brand new") || (lower === "new")) return "New";
  if (lower.includes("fair")) return "Fair";
  if (lower.includes("poor") || lower.includes("damaged")) return "Poor";
  return "Good";
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* try next */
    }
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("No JSON in model response");
}

function parseAnalysis(data: unknown): ProductAnalysis {
  const obj = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  const brand = String(obj.brand ?? obj.manufacturer ?? "Unknown").trim();
  const product = String(obj.product ?? obj.name ?? "Unknown product").trim();
  const model = String(obj.model ?? obj.style ?? "Not visible").trim();
  const color = String(obj.color ?? obj.colour ?? "Unknown").trim();
  const searchQuery =
    String(obj.searchQuery ?? obj.search_query ?? "").trim() ||
    [brand, model, product].filter((p) => !["Unknown", "Not visible"].includes(p)).join(" ");

  const rawSpecifics = obj.itemSpecifics ?? obj.item_specifics;
  const itemSpecifics =
    typeof rawSpecifics === "object" && rawSpecifics !== null
      ? (rawSpecifics as Record<string, string>)
      : {};

  const rawVisible = obj.visibleText ?? obj.visible_text;
  const visibleText = Array.isArray(rawVisible)
    ? rawVisible.map(String).filter(Boolean)
    : [];

  return {
    product,
    brand,
    model,
    color,
    condition: normalizeCondition(String(obj.condition ?? "Good")),
    category: String(obj.category ?? "General").trim(),
    confidence: Math.min(100, Math.max(0, Math.round(Number(obj.confidence) || 70))),
    itemSpecifics,
    searchQuery: searchQuery || product,
    visibleText,
    identificationNotes: String(obj.identificationNotes ?? obj.notes ?? "").trim() || undefined,
    conditionNotes: String(obj.conditionNotes ?? "").trim() || undefined,
  };
}

async function analyzeWithTextJson(modelName: string, photos: string[]): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: VISION_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    maxOutputTokens: 2000,
    ...geminiOptions(),
  });
  return parseAnalysis(extractJson(text));
}

async function analyzeWithStructured(modelName: string, photos: string[]): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { object } = await generateObject({
    model,
    schema: productAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: VISION_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    ...geminiOptions(),
  });
  return parseAnalysis(object);
}

export async function runProductAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const photos = imageUrls.filter(Boolean).slice(0, MAX_PHOTOS);
  if (!photos.length) throw new Error("No photos provided");

  const models = getAnalysisModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await analyzeWithTextJson(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Text JSON failed (${modelName}):`, err);
    }
    try {
      return await analyzeWithStructured(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Structured failed (${modelName}):`, err);
    }
  }

  if (photos.length > 1) {
    const one = [photos[0]];
    for (const modelName of models.slice(0, 1)) {
      try {
        return await analyzeWithTextJson(modelName, one);
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError ?? new Error("Analysis failed");
}

export function isAnalysisAIConfigured(): boolean {
  return isGeminiConfigured() || isOpenAIConfigured();
}
