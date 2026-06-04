import { generateObject, generateText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { GeneratedListing, ProductAnalysis } from "@/types";

const productAnalysisSchema = z.object({
  product: z.string(),
  brand: z.string(),
  model: z.string(),
  color: z.string(),
  condition: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(100),
  itemSpecifics: z.record(z.string(), z.string()),
});

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

const ANALYSIS_PROMPT = `You are an expert eBay reseller assistant analyzing product photos for resale listings.

Study every photo carefully. Look for:
- Brand logos, tags, labels, and packaging text
- Model numbers, SKUs, serial numbers, and size labels
- Material, color, style, and distinguishing features
- Visible wear, damage, stains, or missing parts

Return your best identification for an eBay listing:
- product: specific item name (e.g. "Nike Air Force 1 Low White Sneakers", not "shoes")
- brand: brand name, or "Unbranded" if none visible
- model: model/style number or name, or "Not visible" if unknown
- color: primary color(s)
- condition: one of New, Like New, Good, Fair, Poor — based on visible wear
- category: best eBay category path
- confidence: 0-100 based on how clearly the item is identifiable
- itemSpecifics: useful eBay item specifics (Size, Material, Style, etc.)

If you cannot identify the item clearly, still describe what you see literally and set confidence below 50.
Do not invent brand or model details that are not supported by the photos.`;

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

function getVisionModel(): LanguageModel {
  if (isGeminiConfigured()) {
    const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
    return google("gemini-2.5-flash");
  }

  if (isOpenAIConfigured()) {
    return openai("gpt-4o");
  }

  throw new Error("No AI provider configured");
}

function getTextModel(): LanguageModel {
  return getVisionModel();
}

function toImageParts(imageUrls: string[]) {
  return imageUrls.slice(0, 5).map((url) => {
    const match = url.match(/^data:(image\/[^;]+);base64,/);
    return {
      type: "image" as const,
      image: url,
      ...(match ? { mimeType: match[1] } : {}),
    };
  });
}

function getAnalysisSource(): AnalysisSource {
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return "demo";
}

async function runVisionAnalysis(imageUrls: string[]): Promise<ProductAnalysis> {
  const model = getVisionModel();
  const messages = [
    {
      role: "user" as const,
      content: [{ type: "text" as const, text: ANALYSIS_PROMPT }, ...toImageParts(imageUrls)],
    },
  ];

  try {
    const { object } = await generateObject({
      model,
      schema: productAnalysisSchema,
      messages,
      ...(isGeminiConfigured()
        ? { providerOptions: { google: { structuredOutputs: false } } }
        : {}),
    });
    return object;
  } catch (structuredError) {
    console.warn("[AI] Structured vision analysis failed, retrying with text JSON:", structuredError);

    const { text } = await generateText({
      model,
      messages: [
        ...messages,
        {
          role: "user" as const,
          content:
            "Respond with ONLY valid JSON matching this shape: {\"product\":\"\",\"brand\":\"\",\"model\":\"\",\"color\":\"\",\"condition\":\"\",\"category\":\"\",\"confidence\":0,\"itemSpecifics\":{}}",
        },
      ],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw structuredError;
    }

    return productAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
  }
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
        analysis.confidence < 50
          ? "Low confidence — review and edit the details below before continuing."
          : undefined,
    };
  } catch (error) {
    console.error("[AI] Photo analysis failed:", error);
    throw new Error(
      "AI could not identify this product. Try a clearer photo with the label or brand visible, then edit the fields manually."
    );
  }
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
