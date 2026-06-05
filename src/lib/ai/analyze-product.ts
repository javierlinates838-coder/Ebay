import { generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { ProductAnalysis } from "@/types";
import {
  BRAND_RESCUE_PROMPT,
  DESCRIBE_PROMPT,
  JSON_SCHEMA_INSTRUCTION,
  STRUCTURE_PROMPT,
} from "@/lib/ai/analysis-prompts";
import { preparePhotosForVision } from "@/lib/ai/image-prep-server";

const MAX_PHOTOS = 4;

const KNOWN_BRANDS: { re: RegExp; brand: string }[] = [
  { re: /\bnike\b|swoosh/i, brand: "Nike" },
  { re: /\badidas\b|three stripes/i, brand: "Adidas" },
  { re: /\bjordan\b|jumpman/i, brand: "Jordan" },
  { re: /\bnew balance\b|\bNB\b/i, brand: "New Balance" },
  { re: /\bpuma\b/i, brand: "Puma" },
  { re: /\bunder armour\b|\bUA\b/i, brand: "Under Armour" },
  { re: /\breebok\b/i, brand: "Reebok" },
  { re: /\basics\b/i, brand: "ASICS" },
  { re: /\bmizuno\b/i, brand: "Mizuno" },
  { re: /\bconverse\b/i, brand: "Converse" },
  { re: /\bvans\b/i, brand: "Vans" },
  { re: /\bskechers\b/i, brand: "Skechers" },
  { re: /\bcolumbia\b/i, brand: "Columbia" },
  { re: /\bpatagonia\b/i, brand: "Patagonia" },
  { re: /\bapple\b|\biphone\b|\bipad\b|\bmacbook\b/i, brand: "Apple" },
  { re: /\bsamsung\b/i, brand: "Samsung" },
  { re: /\bsony\b|\bplaystation\b|\bps5\b|\bps4\b/i, brand: "Sony" },
  { re: /\bnintendo\b|\bswitch\b/i, brand: "Nintendo" },
  { re: /\blouis vuitton\b|\bLV\b/i, brand: "Louis Vuitton" },
  { re: /\bgucci\b/i, brand: "Gucci" },
];

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
    {
      type: "text" as const,
      text: `${imageUrls.length} product photo(s) — examine ALL of them:`,
    },
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
      /* continue */
    }
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
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

  const searchQuery =
    String(obj.searchQuery ?? obj.search_query ?? "").trim() ||
    [brand, model, productType, product]
      .filter((p) => p && !["Unknown", "Not visible"].includes(p))
      .join(" ");

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
    productType: productType || undefined,
    condition: normalizeCondition(String(obj.condition ?? "Good")),
    category: String(obj.category ?? "General").trim(),
    confidence: Math.min(100, Math.max(0, Math.round(Number(obj.confidence) || 70))),
    itemSpecifics,
    searchQuery: searchQuery || product,
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
  return !b || b === "unknown" || b === "unbranded" || b === "generic";
}

function isGenericProduct(product: string, productType?: string): boolean {
  const text = `${product} ${productType ?? ""}`.toLowerCase();
  return (
    /^(shoes?|footwear|sneakers?|cleats?|item|product|unknown)/.test(text.trim()) ||
    text === "unknown product" ||
    (text.includes("shoe") && !text.includes("cleat") && !text.includes("sneaker") && !text.includes("boot"))
  );
}

function detectBrandFromText(...sources: string[]): string | null {
  const combined = sources.filter(Boolean).join(" ");
  for (const { re, brand } of KNOWN_BRANDS) {
    if (re.test(combined)) return brand;
  }
  return null;
}

function enrichFromEvidence(
  analysis: ProductAnalysis,
  report: string
): ProductAnalysis {
  const corpus = [
    report,
    analysis.identificationNotes ?? "",
    analysis.visibleText?.join(" ") ?? "",
    analysis.product,
    analysis.model,
    JSON.stringify(analysis.itemSpecifics),
  ].join(" ");

  let { brand, product, productType, confidence } = analysis;
  const { model } = analysis;

  if (isWeakBrand(brand)) {
    const detected = detectBrandFromText(corpus);
    if (detected) {
      brand = detected;
      confidence = Math.max(confidence, 82);
    }
  }

  const lower = corpus.toLowerCase();

  if (isGenericProduct(product, productType)) {
    if (/baseball cleat|metal (spike|cleat)|baseball spike/i.test(lower)) {
      productType = productType || "Baseball Cleats";
      const metal = /metal (spike|cleat)/i.test(lower) ? "Metal " : "";
      if (!isWeakBrand(brand)) {
        product = `${brand} ${metal}Baseball Cleats`.replace(/\s+/g, " ").trim();
      } else {
        product = `${metal}Baseball Cleats`.trim();
      }
      confidence = Math.max(confidence, 78);
    } else if (/basketball shoe|basketball sneaker/i.test(lower)) {
      productType = productType || "Basketball Shoes";
      if (!isWeakBrand(brand)) product = `${brand} Basketball Shoes`;
      confidence = Math.max(confidence, 75);
    } else if (/running shoe|trainer/i.test(lower)) {
      productType = productType || "Running Shoes";
      if (!isWeakBrand(brand)) product = `${brand} Running Shoes`;
      confidence = Math.max(confidence, 75);
    } else if (/football cleat|soccer cleat/i.test(lower)) {
      productType = productType || "Cleats";
      confidence = Math.max(confidence, 75);
    }
  }

  if (/nike/i.test(corpus) && isWeakBrand(brand)) {
    brand = "Nike";
    confidence = Math.max(confidence, 85);
  }

  const searchQuery =
    analysis.searchQuery ||
    [brand, productType, model, product, analysis.color]
      .filter((p) => p && !["Unknown", "Not visible"].includes(p))
      .join(" ");

  const ebayTitleSuggestion =
    analysis.ebayTitleSuggestion ||
    [brand, model !== "Not visible" ? model : productType, analysis.color, analysis.size]
      .filter(Boolean)
      .join(" ")
      .slice(0, 80);

  return {
    ...analysis,
    brand,
    product,
    productType,
    model,
    confidence,
    searchQuery,
    ebayTitleSuggestion: ebayTitleSuggestion || analysis.ebayTitleSuggestion,
    itemSpecifics: {
      ...analysis.itemSpecifics,
      ...(brand && !isWeakBrand(brand) ? { Brand: brand } : {}),
      ...(productType ? { Type: productType } : {}),
    },
  };
}

async function describeProduct(modelName: string, photos: string[]): Promise<string> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: DESCRIBE_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    maxOutputTokens: 3000,
    ...geminiOptions(),
  });

  const report = text.trim();
  if (report.length < 80) {
    throw new Error("Vision description too short");
  }
  return report;
}

async function structureReport(modelName: string, report: string): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [{ role: "user", content: STRUCTURE_PROMPT(report) }],
    maxOutputTokens: 2000,
    ...geminiOptions(),
  });
  return parseAnalysis(extractJson(text));
}

async function rescueBrand(modelName: string, photos: string[]): Promise<Partial<ProductAnalysis>> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: BRAND_RESCUE_PROMPT }, ...toVisionContent(photos)],
      },
    ],
    maxOutputTokens: 400,
    ...geminiOptions(),
  });

  const obj = extractJson(text) as Record<string, unknown>;
  return {
    brand: String(obj.brand ?? "").trim() || undefined,
    productType: String(obj.productType ?? obj.product_type ?? "").trim() || undefined,
    model: String(obj.modelHint ?? obj.model ?? "").trim() || undefined,
    color: String(obj.colors ?? obj.color ?? "").trim() || undefined,
    confidence: Math.round(Number(obj.confidence) || 80),
  };
}

async function runDescribeThenStructure(
  modelName: string,
  photos: string[]
): Promise<ProductAnalysis> {
  const report = await describeProduct(modelName, photos);
  console.info(`[AI] Vision report (${report.length} chars) via ${modelName}`);

  let analysis = await structureReport(modelName, report);
  analysis = enrichFromEvidence(analysis, report);

  if (isWeakBrand(analysis.brand) || isGenericProduct(analysis.product, analysis.productType)) {
    console.info("[AI] Running brand/type rescue pass");
    try {
      const rescue = await rescueBrand(modelName, photos.slice(0, 2));
      if (rescue.brand && !isWeakBrand(rescue.brand)) {
        analysis = enrichFromEvidence(
          {
            ...analysis,
            brand: rescue.brand,
            productType: rescue.productType || analysis.productType,
            model: rescue.model && rescue.model !== "Not visible" ? rescue.model : analysis.model,
            color: rescue.color && rescue.color !== "Unknown" ? rescue.color : analysis.color,
            confidence: Math.max(analysis.confidence, rescue.confidence ?? 80),
          },
          `${report}\nRescue: ${JSON.stringify(rescue)}`
        );
      }
    } catch (err) {
      console.warn("[AI] Brand rescue failed:", err);
    }
  }

  return analysis;
}

async function runDirectJson(modelName: string, photos: string[]): Promise<ProductAnalysis> {
  const model = getModel(modelName);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${DESCRIBE_PROMPT}\n\nThen output JSON:\n${JSON_SCHEMA_INSTRUCTION}`,
          },
          ...toVisionContent(photos),
        ],
      },
    ],
    maxOutputTokens: 3500,
    ...geminiOptions(),
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in direct response");
  const analysis = parseAnalysis(extractJson(jsonMatch[0]));
  return enrichFromEvidence(analysis, text);
}

export async function runProductAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const raw = imageUrls.filter(Boolean).slice(0, MAX_PHOTOS);
  if (!raw.length) throw new Error("No photos provided");

  const photos = await preparePhotosForVision(raw);
  const models = getVisionModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await runDescribeThenStructure(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Describe→structure failed (${modelName}):`, err);
    }

    try {
      return await runDirectJson(modelName, photos);
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Direct JSON failed (${modelName}):`, err);
    }
  }

  if (photos.length > 1) {
    const subset = photos.slice(0, 2);
    for (const modelName of models.slice(0, 1)) {
      try {
        return await runDescribeThenStructure(modelName, subset);
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
