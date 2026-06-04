import { generateObject, type LanguageModel } from "ai";
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

function getAIModel(): LanguageModel {
  if (isGeminiConfigured()) {
    const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
    return google("gemini-2.0-flash");
  }

  if (isOpenAIConfigured()) {
    return openai("gpt-4o");
  }

  throw new Error("No AI provider configured");
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

export async function analyzeProductPhotos(
  imageUrls: string[]
): Promise<ProductAnalysis> {
  if (!isAIConfigured()) {
    return generateMockAnalysis();
  }

  try {
    const { object } = await generateObject({
      model: getAIModel(),
      schema: productAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these product photos for an eBay listing. Identify the product name, brand, model, color, condition (New, Like New, Good, Fair, Poor), eBay category, and item specifics. Provide a confidence score 0-100 for your identification.",
            },
            ...toImageParts(imageUrls),
          ],
        },
      ],
    });

    return object;
  } catch (error) {
    console.warn("[AI] Photo analysis failed, using demo data:", error);
    return generateMockAnalysis();
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
      model: getAIModel(),
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
    });

    return object;
  } catch (error) {
    console.warn("[AI] Listing generation failed, using demo data:", error);
    return generateMockListing(params.analysis, params.marketPrice);
  }
}

function generateMockAnalysis(): ProductAnalysis {
  return {
    product: "Vintage Electronics Item",
    brand: "Unknown Brand",
    model: "Model X",
    color: "Black",
    condition: "Good",
    category: "Consumer Electronics",
    confidence: 72,
    itemSpecifics: {
      Brand: "Unknown Brand",
      Model: "Model X",
      Color: "Black",
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
