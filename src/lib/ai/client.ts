import { generateObject, generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { GeneratedListing, MarketResearch, PricingRecommendation, ProductAnalysis } from "@/types";
import { analyzePricing } from "@/lib/ebay/client";

const productAnalysisSchema = z.object({
  product: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  condition: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(100),
  itemSpecifics: z.record(z.string(), z.string()).optional().default({}),
  identificationNotes: z.string().optional().default(""),
  conditionNotes: z.string().optional().default(""),
  searchQuery: z.string().optional().default(""),
  visibleText: z.array(z.string()).optional().default([]),
});

const REFINEMENT_CONFIDENCE_THRESHOLD = 65;
const MAX_ANALYSIS_PHOTOS = 6;

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"] as const;
type Condition = (typeof CONDITIONS)[number];

function normalizeCondition(raw: string): Condition {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("like new") || lower.includes("like-new")) return "Like New";
  if (lower === "new" || lower.startsWith("new ") || lower.includes("brand new")) return "New";
  if (lower.includes("fair") || lower.includes("acceptable")) return "Fair";
  if (lower.includes("poor") || lower.includes("damaged") || lower.includes("for parts")) return "Poor";
  if (lower.includes("good") || lower.includes("used") || lower.includes("pre-owned")) return "Good";
  return "Good";
}

const TEXT_EXTRACTION_PROMPT = `Transcribe ALL readable text from these product photos — brand names, NIKE tags, model codes, sizes, care labels, serial numbers. List by photo number. If no text, note visible logos/colors.`;

const ANALYSIS_PROMPT = `You are a senior eBay reseller with 15 years of experience identifying products from photos for listings.

You will receive product photos plus any text extracted from labels/tags. Use BOTH the images and extracted text.

## Your process (follow internally before answering)
1. Scan EVERY photo — front, back, tags, soles, interiors, packaging, serial plates
2. Cross-reference visible text with visual features (silhouette, hardware, materials)
3. Identify the most specific eBay-accurate product name possible
4. Grade condition using eBay standards based ONLY on visible evidence
5. Assign confidence honestly — never inflate above what the photos support

## Condition grading (eBay used-item standards)
- New: Tags attached, unused, original packaging
- Like New: No visible wear, may lack tags/box
- Good: Light wear, fully functional, minor cosmetic flaws
- Fair: Obvious wear, scratches, fading, but works/sellable
- Poor: Heavy wear, damage, stains, or missing parts noted

## Field rules
- product: Full specific name (e.g. "Patagonia Better Sweater 1/4-Zip Fleece Jacket", NOT "jacket")
- brand: Exact brand from label/logo, or "Unbranded"
- model: Style name/number from tag (e.g. "25523", "Air Force 1 '07"), or "Not visible"
- color: Primary color(s) as buyers would search
- category: Full eBay category path (e.g. "Clothing, Shoes & Accessories > Men > Men's Clothing > Sweaters")
- itemSpecifics: All eBay-relevant specifics you can support (Size, Material, Style, Type, Department, etc.)
- identificationNotes: 2-3 sentences citing WHAT you saw (e.g. "Patagonia logo on chest, tag reads Style 25523 Size M")
- conditionNotes: Specific visible flaws or "No visible defects noted"
- searchQuery: Best eBay sold-comp search string (brand + model + key descriptor, no condition words)
- visibleText: Array of distinct text strings read from tags/labels (empty array if none)
- confidence: 90+ only if brand AND model confirmed from label/text; 70-89 if brand clear; 50-69 if category clear but brand uncertain; below 50 if guessing

## Critical rules
- NEVER invent model numbers, sizes, or brands not visible in photos or extracted text
- If uncertain between similar items, pick the most likely and lower confidence
- Prefer specificity over generality when evidence supports it`;

const REFINEMENT_PROMPT = `Your previous identification had low confidence. Re-examine the photos with extreme focus on:
- Inside labels and care tags (zoom mentally on tag areas)
- Embossed/stamped model numbers
- Packaging text and barcodes
- Distinctive design features that differentiate similar products
- Size markings on shoes, clothing, electronics

Update your identification using ONLY evidence you can point to. Increase confidence only if you find supporting text or unmistakable visual identifiers.`;

function getVisionModelName(forAnalysis = false): string {
  if (forAnalysis) {
    return (
      process.env.GEMINI_VISION_MODEL?.trim() ||
      process.env.GEMINI_ANALYSIS_MODEL?.trim() ||
      "gemini-2.5-flash"
    );
  }
  return process.env.GEMINI_FAST_MODEL?.trim() || "gemini-2.5-flash";
}

/** Fallback models if primary fails (404, quota, etc.) */
const ANALYSIS_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const listingSchema = z.object({
  title: z.string().max(80),
  description: z.string(),
  itemSpecifics: z.record(z.string(), z.string()),
  keywords: z.array(z.string()),
  shippingSuggestions: z.object({
    weight: z.string(),
    dimensions: z.string(),
    recommendedService: z.string(),
    estimatedCost: z.number(),
  }),
});

export type AnalysisSource = "gemini" | "openai" | "demo";

export interface ProductAnalysisResult {
  analysis: ProductAnalysis;
  source: AnalysisSource;
  warning?: string;
}

function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isAIConfigured(): boolean {
  return isGeminiConfigured() || isOpenAIConfigured();
}

export function getAIProviderName(): "gemini" | "openai" | null {
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return null;
}

function getVisionModel(forAnalysis = false, modelName?: string): LanguageModel {
  if (isGeminiConfigured()) {
    const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
    return google(modelName ?? getVisionModelName(forAnalysis));
  }

  if (isOpenAIConfigured()) {
    return openai(forAnalysis ? "gpt-4o" : "gpt-4o-mini");
  }

  throw new Error("No AI provider configured");
}

function getTextModel(): LanguageModel {
  if (isGeminiConfigured()) {
    const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
    return google(getVisionModelName(false));
  }

  if (isOpenAIConfigured()) {
    return openai("gpt-4o-mini");
  }

  throw new Error("No AI provider configured");
}

function toLabeledImageContent(imageUrls: string[]) {
  const parts: Array<{ type: "text"; text: string } | { type: "image"; image: string; mimeType?: string }> = [];

  for (const [index, url] of imageUrls.entries()) {
    const match = url.match(/^data:(image\/[^;]+);base64,/);
    const photoNum = index + 1;
    const hint =
      photoNum === 1
        ? " (main / front view — start here)"
        : photoNum === imageUrls.length
          ? " (additional angle or detail)"
          : "";

    parts.push({
      type: "text",
      text: `\n--- Photo ${photoNum} of ${imageUrls.length}${hint} ---`,
    });
    parts.push({
      type: "image",
      image: url,
      ...(match ? { mimeType: match[1] } : {}),
    });
  }

  return parts;
}

function getAnalysisSource(): AnalysisSource {
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return "demo";
}

function geminiOptions() {
  return isGeminiConfigured()
    ? { providerOptions: { google: { structuredOutputs: false } } }
    : {};
}

function getModelCandidates(): string[] {
  const primary = getVisionModelName(true);
  const fallbacks = ANALYSIS_MODEL_FALLBACKS.filter((m) => m !== primary);
  return [primary, ...fallbacks];
}

function parseLooseAnalysis(data: unknown): z.infer<typeof productAnalysisSchema> {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    return productAnalysisSchema.parse({
      product: obj.product ?? obj.name ?? obj.title ?? "Unknown product",
      brand: obj.brand ?? obj.manufacturer ?? "Unknown",
      model: obj.model ?? obj.style ?? obj.styleNumber ?? "Not visible",
      color: obj.color ?? obj.colour ?? "Unknown",
      condition: obj.condition ?? "Good",
      category: obj.category ?? "General",
      confidence: typeof obj.confidence === "number" ? obj.confidence : 50,
      itemSpecifics: obj.itemSpecifics ?? obj.item_specifics ?? {},
      identificationNotes: obj.identificationNotes ?? obj.notes ?? "",
      conditionNotes: obj.conditionNotes ?? "",
      searchQuery: obj.searchQuery ?? obj.search_query ?? "",
      visibleText: obj.visibleText ?? obj.visible_text ?? [],
    });
  }
  throw new Error("Invalid analysis response");
}

function normalizeAnalysis(raw: z.infer<typeof productAnalysisSchema>): ProductAnalysis {
  const condition = normalizeCondition(raw.condition);
  const searchQuery =
    raw.searchQuery?.trim() ||
    [raw.brand, raw.model, raw.product.split(" ").slice(0, 4).join(" ")]
      .filter((p) => p && p !== "Unknown" && p !== "Not visible" && p !== "Unbranded")
      .join(" ")
      .trim();

  return {
    product: raw.product.trim() || "Unknown product",
    brand: raw.brand.trim() || "Unknown",
    model: raw.model.trim() || "Not visible",
    color: raw.color.trim() || "Unknown",
    condition,
    category: raw.category.trim() || "General",
    confidence: Math.min(100, Math.max(0, Math.round(raw.confidence))),
    itemSpecifics: raw.itemSpecifics ?? {},
    searchQuery: searchQuery || raw.product,
    visibleText: (raw.visibleText ?? []).filter(Boolean),
    identificationNotes: raw.identificationNotes?.trim() || undefined,
    conditionNotes: raw.conditionNotes?.trim() || undefined,
  };
}

async function identifyWithModel(
  imageUrls: string[],
  modelName: string,
  extractedText?: string,
  refinementContext?: ProductAnalysis
): Promise<ProductAnalysis> {
  const model = getVisionModel(true, modelName);
  const contextBlock = extractedText
    ? `\n\nText visible in photos:\n${extractedText}`
    : "";

  const refinementBlock = refinementContext
    ? `\n\nPrevious attempt (improve this):\n${JSON.stringify(refinementContext)}\n${REFINEMENT_PROMPT}`
    : "";

  const messages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: ANALYSIS_PROMPT + contextBlock + refinementBlock },
        ...toLabeledImageContent(imageUrls),
      ],
    },
  ];

  try {
    const { object } = await generateObject({
      model,
      schema: productAnalysisSchema,
      messages,
      ...geminiOptions(),
    });
    return normalizeAnalysis(object);
  } catch (structuredError) {
    console.warn(`[AI] Structured output failed (${modelName}):`, structuredError);

    const { text } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: "user" as const,
          content:
            'Return ONLY JSON: {"product":"","brand":"","model":"","color":"","condition":"Good","category":"","confidence":80,"itemSpecifics":{},"identificationNotes":"","conditionNotes":"","searchQuery":"","visibleText":[]}',
        },
      ],
      ...geminiOptions(),
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw structuredError;

    return normalizeAnalysis(parseLooseAnalysis(JSON.parse(jsonMatch[0])));
  }
}

async function identifyProduct(
  imageUrls: string[],
  extractedText: string,
  refinementContext?: ProductAnalysis
): Promise<ProductAnalysis> {
  const models = getModelCandidates();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await identifyWithModel(imageUrls, modelName, extractedText, refinementContext);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Model ${modelName} failed:`, err);
    }
  }

  throw lastError ?? new Error("All vision models failed");
}

async function extractVisibleText(imageUrls: string[]): Promise<string> {
  const model = getVisionModel(true, "gemini-2.5-flash");
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: TEXT_EXTRACTION_PROMPT }, ...toLabeledImageContent(imageUrls.slice(0, 3))],
      },
    ],
    ...geminiOptions(),
  });
  return text.trim();
}

async function runVisionAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const photos = imageUrls.slice(0, MAX_ANALYSIS_PHOTOS);

  // Run identification immediately — don't block on OCR
  let analysis: ProductAnalysis;
  try {
    analysis = await identifyProduct(photos, "");
  } catch (firstPassError) {
    console.warn("[AI] First pass failed, retrying with fewer photos:", firstPassError);
    analysis = await identifyProduct(photos.slice(0, 3), "");
  }

  // Enrich with OCR if brand still unknown and we have time
  if (analysis.confidence < 80 || analysis.brand === "Unknown") {
    try {
      const extractedText = await extractVisibleText(photos);
      if (extractedText) {
        const enriched = await identifyWithModel(
          photos,
          getModelCandidates()[0],
          extractedText,
          analysis.confidence < REFINEMENT_CONFIDENCE_THRESHOLD ? analysis : undefined
        );
        if (enriched.confidence >= analysis.confidence) {
          analysis = enriched;
        }
      }
    } catch (err) {
      console.warn("[AI] OCR enrichment skipped:", err);
    }
  } else if (analysis.confidence < REFINEMENT_CONFIDENCE_THRESHOLD) {
    try {
      const refined = await identifyWithModel(
        photos,
        getModelCandidates()[0],
        "",
        analysis
      );
      if (refined.confidence >= analysis.confidence) {
        analysis = refined;
      }
    } catch (err) {
      console.warn("[AI] Refinement skipped:", err);
    }
  }

  return analysis;
}

export async function analyzeProductPhotos(
  imageUrls: string[]
): Promise<ProductAnalysisResult> {
  if (!isAIConfigured()) {
    return {
      analysis: generateMockAnalysis(),
      source: "demo",
      warning:
        "Demo mode — add GEMINI_API_KEY in Vercel for real product identification.",
    };
  }

  try {
    const analysis = await runVisionAnalysis(imageUrls);
    return {
      analysis,
      source: getAnalysisSource(),
      warning:
        analysis.confidence < 65
          ? "Verify the details below — edit anything that looks wrong."
          : analysis.confidence < 80
            ? "Moderate confidence — double-check brand and model."
            : undefined,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[AI] Photo analysis failed after all retries:", detail);

    // Last resort: return editable placeholder instead of blocking the user
    return {
      analysis: {
        product: "Could not auto-identify — edit this",
        brand: "Unknown",
        model: "Not visible",
        color: "Unknown",
        condition: "Good",
        category: "General",
        confidence: 20,
        itemSpecifics: { Condition: "Good" },
        identificationNotes: `AI analysis hit an error (${detail.slice(0, 120)}). The photos uploaded fine — please fill in the product details manually.`,
        conditionNotes: "Review photos and set condition manually.",
        searchQuery: "",
        visibleText: [],
      },
      source: getAnalysisSource(),
      warning:
        "AI had a technical issue but your photos are saved. Fill in the product details below and continue.",
    };
  }
}

const marketEstimateSchema = z.object({
  averageSoldPrice: z.number(),
  highestSoldPrice: z.number(),
  lowestSoldPrice: z.number(),
  suggestedListingPrice: z.number(),
  suggestedAuctionPrice: z.number(),
  recentSalesTrend: z.enum(["up", "down", "stable"]),
  reasoning: z.string(),
  sampleCompTitles: z.array(z.string()).max(5),
  sampleCompPrices: z.array(z.number()).max(5),
});

export type MarketResearchSource = "ebay-live" | "ai-estimate" | "demo";

export interface MarketResearchResult {
  market: MarketResearch;
  pricing: PricingRecommendation;
  source: MarketResearchSource;
}

export async function estimateMarketPricing(
  query: string,
  analysis?: ProductAnalysis | null
): Promise<MarketResearchResult> {
  if (!isAIConfigured()) {
    const { searchSoldListings } = await import("@/lib/ebay/client");
    const market = await searchSoldListings(query);
    return {
      market,
      pricing: analyzePricing(market),
      source: "demo",
    };
  }

  const { object } = await generateObject({
    model: getTextModel(),
    schema: marketEstimateSchema,
    prompt: `You are an expert eBay reseller pricing analyst. Estimate realistic sold-price ranges for this item on eBay US.

Search query: ${query}
${analysis ? `Product: ${analysis.product}\nBrand: ${analysis.brand}\nModel: ${analysis.model}\nCondition: ${analysis.condition}\nCategory: ${analysis.category}` : ""}

Base your estimate on typical eBay resale values for similar items. Be realistic — not optimistic.
Provide sample comp titles and prices that resemble what you'd expect to see.`,
    ...(isGeminiConfigured()
      ? { providerOptions: { google: { structuredOutputs: false } } }
      : {}),
  });

  const soldComps = object.sampleCompTitles.map((title, i) => ({
    title,
    price: object.sampleCompPrices[i] ?? object.averageSoldPrice,
    soldDate: new Date(Date.now() - i * 4 * 24 * 60 * 60 * 1000).toISOString(),
    condition: analysis?.condition,
  }));

  const market: MarketResearch = {
    averageSoldPrice: object.averageSoldPrice,
    highestSoldPrice: object.highestSoldPrice,
    lowestSoldPrice: object.lowestSoldPrice,
    numberSold: soldComps.length || 8,
    recentSalesTrend: object.recentSalesTrend,
    suggestedListingPrice: object.suggestedListingPrice,
    suggestedAuctionPrice: object.suggestedAuctionPrice,
    soldComps,
  };

  return {
    market,
    pricing: {
      ...analyzePricing(market),
      reasoning: object.reasoning,
    },
    source: "ai-estimate",
  };
}

export async function generateListing(params: {
  analysis: ProductAnalysis;
  marketPrice?: number;
  notes?: string;
}): Promise<GeneratedListing> {
  if (!isAIConfigured()) {
    return generateMockListing(params.analysis, params.marketPrice);
  }

  try {
    const { object } = await generateObject({
      model: getTextModel(),
      schema: listingSchema,
      prompt: `Generate an SEO-optimized eBay listing for this item:
Product: ${params.analysis.product}
Brand: ${params.analysis.brand}
Model: ${params.analysis.model}
Color: ${params.analysis.color}
Condition: ${params.analysis.condition}
Category: ${params.analysis.category}
${params.marketPrice ? `Suggested price: $${params.marketPrice}` : ""}
${params.notes ? `Seller notes: ${params.notes}` : ""}

Requirements:
- Title: max 80 chars, keyword-rich, brand + model + key features
- Description: detailed HTML-friendly description with condition notes, features, what's included
- Item specifics: all relevant eBay item specifics
- Keywords: 10-15 search keywords
- Shipping: estimate weight, dimensions, best USPS/UPS service, cost`,
      ...(isGeminiConfigured()
        ? { providerOptions: { google: { structuredOutputs: false } } }
        : {}),
    });

    return object;
  } catch (error) {
    console.warn("[AI] Listing generation failed, using template:", error);
    return generateMockListing(params.analysis, params.marketPrice);
  }
}

function generateMockAnalysis(): ProductAnalysis {
  return {
    product: "Unidentified Item — edit me",
    brand: "Unknown",
    model: "Not visible",
    color: "Unknown",
    condition: "Good",
    category: "General",
    confidence: 25,
    itemSpecifics: {
      Condition: "Good",
    },
    identificationNotes: "Demo mode — add GEMINI_API_KEY for real identification.",
    conditionNotes: "Unable to assess in demo mode.",
    searchQuery: "",
    visibleText: [],
  };
}

function generateMockListing(
  analysis: ProductAnalysis,
  marketPrice?: number
): GeneratedListing {
  const title = `${analysis.brand} ${analysis.model} ${analysis.color} - ${analysis.condition}`.slice(
    0,
    80
  );

  return {
    title,
    description: `<h2>${analysis.product}</h2>
<p><strong>Brand:</strong> ${analysis.brand}</p>
<p><strong>Model:</strong> ${analysis.model}</p>
<p><strong>Color:</strong> ${analysis.color}</p>
<p><strong>Condition:</strong> ${analysis.condition}</p>
<p>This item has been inspected and is ready for sale. Please see photos for detailed condition.</p>
<p>Ships within 1 business day with tracking.</p>`,
    itemSpecifics: analysis.itemSpecifics,
    keywords: [
      analysis.brand,
      analysis.model,
      analysis.product,
      analysis.color,
      analysis.condition,
      "eBay",
      "fast shipping",
    ],
    shippingSuggestions: {
      weight: "1.5 lbs",
      dimensions: "10 x 8 x 4 inches",
      recommendedService: "USPS Priority Mail",
      estimatedCost: marketPrice ? Math.min(marketPrice * 0.1, 12) : 8.99,
    },
  };
}
