import { generateObject, generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ProductAnalysis } from "@/types";
import {
  ANALYSIS_SYSTEM,
  ANALYSIS_USER,
  RETRY_USER,
} from "@/lib/ai/analysis-prompts";
import { preparePhotosForVision } from "@/lib/ai/image-prep-server";
import { buildVisionMessage, totalPhotoBytes } from "@/lib/ai/vision-utils";

const MAX_PHOTOS = 4;

const analysisSchema = z.object({
  product: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  size: z.string().optional(),
  gender: z.string().optional(),
  material: z.string().optional(),
  productType: z.string().optional(),
  condition: z.string(),
  category: z.string(),
  confidence: z.number(),
  itemSpecifics: z.record(z.string(), z.string()),
  identificationNotes: z.string(),
  conditionNotes: z.string(),
  searchQuery: z.string(),
  visibleText: z.array(z.string()),
  defects: z.array(z.string()).optional(),
  ebayTitleSuggestion: z.string().optional(),
  compsKeywords: z.array(z.string()).optional(),
});

const GENERIC_PRODUCT =
  /^(unknown|unidentified|item|product|thing|stuff|object|merchandise|could not)/i;
const GENERIC_TYPES =
  /^(shoes?|footwear|sneakers?|shirt|clothing|apparel|phone|device|electronics?|accessory|bag|tool|toy|game|book|home|general)$/i;

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

function getVisionModels(): string[] {
  const primary =
    process.env.GEMINI_VISION_MODEL?.trim() ||
    process.env.GEMINI_ANALYSIS_MODEL?.trim() ||
    "gemini-2.5-flash";
  return [
    primary,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
  ].filter((m, i, arr) => arr.indexOf(m) === i);
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

function providerOptions() {
  return isGeminiConfigured()
    ? {
        providerOptions: {
          google: {
            structuredOutputs: false,
            temperature: 0.15,
          },
        },
      }
    : {};
}

function normalizeCondition(raw: string): ProductAnalysis["condition"] {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("like new")) return "Like New";
  if (lower.includes("brand new") || lower === "new") return "New";
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
      /* continue */
    }
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("No JSON in model response");
}

function parseAnalysis(data: unknown): ProductAnalysis {
  const obj = (typeof data === "object" && data !== null ? data : {}) as Record<
    string,
    unknown
  >;

  const brand = String(obj.brand ?? obj.manufacturer ?? "Unknown").trim();
  const product = String(obj.product ?? obj.name ?? "Unknown product").trim();
  const model = String(obj.model ?? obj.style ?? "Not visible").trim();
  const color = String(obj.color ?? obj.colour ?? "Unknown").trim();
  const productType = String(obj.productType ?? obj.product_type ?? "").trim();

  const rawSpecifics = obj.itemSpecifics ?? obj.item_specifics;
  const itemSpecifics =
    typeof rawSpecifics === "object" && rawSpecifics !== null
      ? (rawSpecifics as Record<string, string>)
      : {};

  const rawVisible = obj.visibleText ?? obj.visible_text;
  const visibleText = Array.isArray(rawVisible)
    ? rawVisible.map(String).filter(Boolean)
    : [];

  const rawDefects = obj.defects;
  const defects = Array.isArray(rawDefects)
    ? rawDefects.map(String).filter(Boolean)
    : undefined;

  const rawKeywords = obj.compsKeywords ?? obj.comps_keywords;
  const compsKeywords = Array.isArray(rawKeywords)
    ? rawKeywords.map(String).filter(Boolean)
    : undefined;

  const searchQuery =
    String(obj.searchQuery ?? obj.search_query ?? "").trim() ||
    [brand, productType, model, product]
      .filter((p) => p && !["Unknown", "Not visible"].includes(p))
      .join(" ");

  return {
    product,
    brand,
    model,
    color,
    size: String(obj.size ?? "").trim() || undefined,
    gender: String(obj.gender ?? "").trim() || undefined,
    material: String(obj.material ?? "").trim() || undefined,
    productType: productType || undefined,
    condition: normalizeCondition(String(obj.condition ?? "Good")),
    category: String(obj.category ?? "General").trim(),
    confidence: Math.min(100, Math.max(0, Math.round(Number(obj.confidence) || 70))),
    itemSpecifics,
    searchQuery,
    visibleText,
    identificationNotes: String(obj.identificationNotes ?? obj.notes ?? "").trim() || undefined,
    conditionNotes: String(obj.conditionNotes ?? "").trim() || undefined,
    defects: defects?.length ? defects : undefined,
    ebayTitleSuggestion:
      String(obj.ebayTitleSuggestion ?? obj.ebay_title_suggestion ?? "").trim() || undefined,
    compsKeywords: compsKeywords?.length ? compsKeywords : undefined,
  };
}

function isWeakBrand(brand: string): boolean {
  const b = brand.toLowerCase().trim();
  return !b || b === "unknown" || b === "unbranded" || b === "generic" || b === "none";
}

export function isPoorAnalysis(analysis: ProductAnalysis): boolean {
  const product = analysis.product.trim();
  const type = (analysis.productType ?? "").trim();

  if (analysis.confidence < 55) return true;
  if (GENERIC_PRODUCT.test(product)) return true;
  if (product.split(/\s+/).length <= 2 && GENERIC_TYPES.test(product)) return true;
  if (type && GENERIC_TYPES.test(type) && isWeakBrand(analysis.brand)) return true;
  if (isWeakBrand(analysis.brand) && !analysis.visibleText?.length && analysis.confidence < 75) {
    return true;
  }

  return false;
}

async function analyzeWithObject(
  modelName: string,
  photos: string[],
  userPrompt: string
): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { object } = await generateObject({
    model,
    schema: analysisSchema,
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: buildVisionMessage(userPrompt, photos),
      },
    ],
    maxOutputTokens: 2500,
    ...providerOptions(),
  });
  return parseAnalysis(object);
}

async function analyzeWithTextJson(
  modelName: string,
  photos: string[],
  userPrompt: string
): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: buildVisionMessage(
          `${userPrompt}\n\nRespond with ONLY valid JSON matching the product analysis schema.`,
          photos
        ),
      },
    ],
    maxOutputTokens: 2500,
    ...providerOptions(),
  });
  return parseAnalysis(extractJson(text));
}

async function runOneModel(modelName: string, photos: string[]): Promise<ProductAnalysis> {
  let analysis: ProductAnalysis;

  try {
    analysis = await analyzeWithObject(modelName, photos, ANALYSIS_USER);
  } catch (err) {
    console.warn(`[AI] generateObject failed (${modelName}):`, err);
    analysis = await analyzeWithTextJson(modelName, photos, ANALYSIS_USER);
  }

  if (isPoorAnalysis(analysis)) {
    console.info(`[AI] Weak result (${analysis.confidence}%) — retrying ${modelName}`);
    try {
      const retry = await analyzeWithObject(modelName, photos, RETRY_USER);
      if (!isPoorAnalysis(retry) || retry.confidence > analysis.confidence) {
        return retry;
      }
    } catch {
      try {
        const retry = await analyzeWithTextJson(modelName, photos, RETRY_USER);
        if (!isPoorAnalysis(retry) || retry.confidence > analysis.confidence) {
          return retry;
        }
      } catch {
        /* keep first result */
      }
    }
  }

  return analysis;
}

export async function runProductAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const raw = imageUrls.filter(Boolean).slice(0, MAX_PHOTOS);
  if (!raw.length) throw new Error("No photos provided");

  const photos = await preparePhotosForVision(raw);
  const bytes = totalPhotoBytes(photos);
  console.info(`[AI] Analyzing ${photos.length} photo(s), ${Math.round(bytes / 1024)}KB total`);

  if (bytes < 5000) {
    throw new Error("Photos appear empty or corrupted — try re-uploading");
  }

  const models = getVisionModels();
  let lastError: unknown;
  let bestResult: ProductAnalysis | null = null;

  for (const modelName of models) {
    try {
      const result = await runOneModel(modelName, photos);
      if (!isPoorAnalysis(result)) {
        console.info(`[AI] Success via ${modelName} (${result.confidence}%): ${result.product}`);
        return result;
      }
      if (!bestResult || result.confidence > bestResult.confidence) {
        bestResult = result;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Model failed (${modelName}):`, err);
    }
  }

  if (bestResult) {
    console.warn(`[AI] Returning best weak result: ${bestResult.product}`);
    return bestResult;
  }

  if (photos.length > 1) {
    const subset = [photos[0], photos[1]].filter(Boolean);
    for (const modelName of models.slice(0, 2)) {
      try {
        return await runOneModel(modelName, subset);
      } catch (err) {
        lastError = err;
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : "Analysis failed";
  throw new Error(msg);
}

export function isAnalysisAIConfigured(): boolean {
  return isGeminiConfigured() || isOpenAIConfigured();
}
