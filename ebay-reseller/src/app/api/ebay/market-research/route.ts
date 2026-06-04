import { NextRequest } from "next/server";
import { searchSoldListings, analyzePricing } from "@/lib/ebay/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ query: string }>(request);

    if (!body.query?.trim()) {
      throw new ApiError("Search query is required", 400);
    }

    const market = await searchSoldListings(body.query.trim());
    const pricing = analyzePricing(market);

    return Response.json({ market, pricing });
  } catch (error) {
    return handleApiError(error);
  }
}
