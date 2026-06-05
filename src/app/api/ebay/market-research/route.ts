import { NextRequest } from "next/server";
import { isEbayConfigured, searchSoldListings, analyzePricing } from "@/lib/ebay/client";
import { estimateMarketPricing } from "@/lib/ai/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";
import type { ProductAnalysis } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ query: string; analysis?: ProductAnalysis }>(request);

    if (!body.query?.trim()) {
      throw new ApiError("Search query is required", 400);
    }

    const query = body.query.trim();

    if (isEbayConfigured()) {
      try {
        const market = await searchSoldListings(query);
        return Response.json({
          market,
          pricing: analyzePricing(market),
          source: "ebay-live",
        });
      } catch (err) {
        console.warn("[Market] eBay search failed, falling back:", err);
      }
    }

    try {
      const result = await estimateMarketPricing(query, body.analysis);
      return Response.json(result);
    } catch (err) {
      console.warn("[Market] AI estimate failed, using demo:", err);
      const market = await searchSoldListings(query);
      return Response.json({
        market,
        pricing: analyzePricing(market),
        source: "demo",
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
