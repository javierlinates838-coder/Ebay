import { NextRequest } from "next/server";
import { analyzeProductPhotos } from "@/lib/openai/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ imageUrls: string[] }>(request);

    if (!body.imageUrls?.length) {
      throw new ApiError("At least one image URL is required", 400);
    }

    if (body.imageUrls.length > 10) {
      throw new ApiError("Maximum 10 images allowed", 400);
    }

    const analysis = await analyzeProductPhotos(body.imageUrls);
    return Response.json({ analysis });
  } catch (error) {
    return handleApiError(error);
  }
}
