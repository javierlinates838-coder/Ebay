import { NextRequest } from "next/server";
import { generateListing } from "@/lib/openai/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";
import type { ProductAnalysis } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      analysis: ProductAnalysis;
      marketPrice?: number;
      notes?: string;
    }>(request);

    if (!body.analysis) {
      throw new ApiError("Product analysis is required", 400);
    }

    const listing = await generateListing(body);
    return Response.json({ listing });
  } catch (error) {
    return handleApiError(error);
  }
}
