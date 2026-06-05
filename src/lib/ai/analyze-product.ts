import { generateObject, generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ProductAnalysis } from "@/types";
import {
  CATEGORY_EXPERT_PROMPTS,
  CATEGORY_SCOUT_PROMPT,
  DEEP_ANALYSIS_JSON_INSTRUCTION,
  OCR_PROMPT,
  REFINE_PROMPT,
  type ProductCategory,
} from "@/lib/ai/analysis-prompts";
import { preparePhotosForVision } from "@/lib/ai/image-prep-server";

const MAX_PHOTOS = 5;
const REFINE_CONFIDENCE_THRESHOLD = 75;

const VALID_CATEGORIES: ProductCategory[] = [
  "footwear",
  "clothing",
  "electronics",
  "sporting",
  "collectibles",
  "home",
  "accessories",
  "general",
];

const scoutSchema = z.object({
  category: z.string(),
  brandHint: z.string(),
  hasReadableTags: z.boolean(),
  visualSummary: z.string(),
});

const deepAnalysisSchema = z.object({
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

interface ScoutResult {
  category: ProductCategory;
  brandHint: string;
  hasReadableTags: boolean;
  visualSummary: string;
}

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
      /* try next */
    }
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error("No JSON in model response");
}

function normalizeCategory(raw: string): ProductCategory {
  const lower = raw.toLowerCase().trim();
  const found = VALID_CATEGORIES.find((c) => lower.includes(c));
  return found ?? "general";
}

function parseAnalysis(data: unknown, scout?: ScoutResult): ProductAnalysis {
  const obj = (typeof data === "object" && data !== null ? data : {}) as Record<
    string,
    unknown
  >;

  const brand = String(
    obj.brand ?? obj.manufacturer ?? scout?.brandHint ?? "Unknown"
  ).trim();
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

  const rawDefects = obj.defects;
  const defects = Array.isArray(rawDefects)
    ? rawDefects.map(String).filter(Boolean)
    : undefined;

  const rawKeywords = obj.compsKeywords ?? obj.comps_keywords;
  const compsKeywords = Array.isArray(rawKeywords)
    ? rawKeywords.map(String).filter(Boolean)
    : undefined;

  return {
    product,
    brand,
    model,
    color,
    size: String(obj.size ?? "").trim() || undefined,
    gender: String(obj.gender ?? "").trim() || undefined,
    material: String(obj.material ?? "").trim() || undefined,
    productType: String(obj.productType ?? obj.product_type ?? "").trim() || undefined,
    condition: normalizeCondition(String(obj.condition ?? "Good")),
    category: String(obj.category ?? scout?.category ?? "General").trim(),
    confidence: Math.min(100, Math.max(0, Math.round(Number(obj.confidence) || 70))),
    itemSpecifics,
    searchQuery: searchQuery || product,
    visibleText,
    identificationNotes:
      String(obj.identificationNotes ?? obj.notes ?? scout?.visualSummary ?? "").trim() ||
      undefined,
    conditionNotes: String(obj.conditionNotes ?? "").trim() || undefined,
    defects: defects?.length ? defects : undefined,
    ebayTitleSuggestion:
      String(obj.ebayTitleSuggestion ?? obj.ebay_title_suggestion ?? "").trim() || undefined,
    compsKeywords: compsKeywords?.length ? compsKeywords : undefined,
  };
}

async function runCategoryScout(modelName: string, photos: string[]): Promise<ScoutResult> {
  const model = getModel(modelName);
  try {
    const { object } = await generateObject({
      model,
      schema: scoutSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CATEGORY_SCOUT_PROMPT },
            ...toVisionContent(photos),
          ],
        },
      ],
      maxOutputTokens: 600,
      ...geminiOptions(),
    });
    return {
      category: normalizeCategory(object.category),
      brandHint: object.brandHint.trim() || "Unknown",
      hasReadableTags: object.hasReadableTags,
      visualSummary: object.visualSummary.trim(),
    };
  } catch {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CATEGORY_SCOUT_PROMPT },
            ...toVisionContent(photos),
          ],
        },
      ],
      maxOutputTokens: 600,
      ...geminiOptions(),
    });
    const parsed = extractJson(text) as Record<string, unknown>;
    return {
      category: normalizeCategory(String(parsed.category ?? "general")),
      brandHint: String(parsed.brandHint ?? "Unknown").trim(),
      hasReadableTags: Boolean(parsed.hasReadableTags),
      visualSummary: String(parsed.visualSummary ?? "").trim(),
    };
  }
}

async function runOCR(modelName: string, photos: string[]): Promise<string> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: OCR_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    maxOutputTokens: 1500,
    ...geminiOptions(),
  });
  return text.trim();
}

function buildDeepPrompt(scout: ScoutResult, ocrText: string): string {
  const expert = CATEGORY_EXPERT_PROMPTS[scout.category];
  return `${expert}

SCOUT REPORT:
- Category: ${scout.category}
- Brand hint: ${scout.brandHint}
- Tags readable: ${scout.hasReadableTags}
- Visual summary: ${scout.visualSummary}

OCR / TAG TRANSCRIPTION:
${ocrText || "(No readable text — rely on logos, shapes, and colors)"}

${DEEP_ANALYSIS_JSON_INSTRUCTION}`;
}

async function runDeepAnalysis(
  modelName: string,
  photos: string[],
  scout: ScoutResult,
  ocrText: string
): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const prompt = buildDeepPrompt(scout, ocrText);

  try {
    const { object } = await generateObject({
      model,
      schema: deepAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...toVisionContent(photos)],
        },
      ],
      maxOutputTokens: 2500,
      ...geminiOptions(),
    });
    return parseAnalysis(object, scout);
  } catch {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...toVisionContent(photos)],
        },
      ],
      maxOutputTokens: 2500,
      ...geminiOptions(),
    });
    return parseAnalysis(extractJson(text), scout);
  }
}

async function runRefinement(
  modelName: string,
  photos: string[],
  prior: ProductAnalysis,
  scout: ScoutResult,
  ocrText: string
): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const context = `${REFINE_PROMPT}

PRIOR ANALYSIS (confidence ${prior.confidence}%):
${JSON.stringify(prior, null, 2)}

SCOUT: ${scout.visualSummary} | brand hint: ${scout.brandHint}
OCR:
${ocrText}

${CATEGORY_EXPERT_PROMPTS[scout.category]}
${DEEP_ANALYSIS_JSON_INSTRUCTION}`;

  try {
    const { object } = await generateObject({
      model,
      schema: deepAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: context }, ...toVisionContent(photos)],
        },
      ],
      maxOutputTokens: 2500,
      ...geminiOptions(),
    });
    const refined = parseAnalysis(object, scout);
    return refined.confidence >= prior.confidence ? refined : prior;
  } catch {
    return prior;
  }
}

const FALLBACK_PROMPT = `You are an expert eBay reseller identifying a product from photos.

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
{"product":"","brand":"","model":"","color":"","size":"","gender":"","material":"","productType":"","condition":"Good","category":"","confidence":85,"itemSpecifics":{},"identificationNotes":"","conditionNotes":"","searchQuery":"","visibleText":[],"defects":[],"ebayTitleSuggestion":"","compsKeywords":[]}`;

async function runSinglePassFallback(
  modelName: string,
  photos: string[]
): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: FALLBACK_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    maxOutputTokens: 2000,
    ...geminiOptions(),
  });
  return parseAnalysis(extractJson(text));
}

async function runMultiPhaseAnalysis(
  modelName: string,
  photos: string[]
): Promise<ProductAnalysis> {
  const [scout, ocrText] = await Promise.all([
    runCategoryScout(modelName, photos),
    runOCR(modelName, photos),
  ]);

  console.info(
    `[AI] Scout: ${scout.category}, brand=${scout.brandHint}, tags=${scout.hasReadableTags}`
  );

  let analysis = await runDeepAnalysis(modelName, photos, scout, ocrText);

  if (analysis.confidence < REFINE_CONFIDENCE_THRESHOLD) {
    console.info(`[AI] Refining (confidence ${analysis.confidence}%)`);
    analysis = await runRefinement(modelName, photos, analysis, scout, ocrText);
  }

  return analysis;
}

export async function runProductAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const raw = imageUrls.filter(Boolean).slice(0, MAX_PHOTOS);
  if (!raw.length) throw new Error("No photos provided");

  const photos = await preparePhotosForVision(raw);
  const models = getAnalysisModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await runMultiPhaseAnalysis(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Multi-phase failed (${modelName}):`, err);
    }

    try {
      return await runSinglePassFallback(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Single-pass fallback failed (${modelName}):`, err);
    }
  }

  if (photos.length > 1) {
    const one = [photos[0]];
    for (const modelName of models.slice(0, 1)) {
      try {
        return await runMultiPhaseAnalysis(modelName, one);
      } catch (err) {
        lastError = err;
      }
      try {
        return await runSinglePassFallback(modelName, one);
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
