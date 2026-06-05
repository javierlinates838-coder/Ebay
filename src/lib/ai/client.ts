import { generateObject, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { GeneratedListing, MarketResearch, PricingRecommendation, ProductAnalysis } from "@/types";
import { analyzePricing } from "@/lib/ebay/client";
import { runProductAnalysis } from "@/lib/ai/analyze-product";

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

function getAnalysisSource(): AnalysisSource {
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return "demo";
}

function getTextModel(): LanguageModel {
  if (isGeminiConfigured()) {
    const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
    return google(process.env.GEMINI_FAST_MODEL?.trim() || "gemini-2.5-flash");
  }

  if (isOpenAIConfigured()) {
    return openai("gpt-4o-mini");
  }

  throw new Error("No AI provider configured");
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
    const analysis = await runProductAnalysis(imageUrls);
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

  try {
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
  } catch (err) {
    console.warn("[AI] Market pricing failed, using demo:", err);
    const { searchSoldListings } = await import("@/lib/ebay/client");
    const market = await searchSoldListings(query);
    return {
      market,
      pricing: analyzePricing(market),
      source: "demo",
    };
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
