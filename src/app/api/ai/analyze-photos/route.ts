import { NextRequest } from "next/server";
import { analyzeProductPhotos } from "@/lib/ai/client";
import { blobToDataUrl } from "@/lib/data-url";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";

export const maxDuration = 120;

async function readImageUrls(request: NextRequest): Promise<string[]> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const files = formData
      .getAll("images")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!files.length) {
      return [];
    }

    return Promise.all(files.map((file) => blobToDataUrl(file)));
  }

  const body = await parseJsonBody<{ imageUrls?: string[] }>(request);
  return (body.imageUrls || []).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const imageUrls = await readImageUrls(request);

    if (!imageUrls.length) {
      throw new ApiError(
        "No photos received. Upload at least one image, then try Analyze again.",
        400
      );
    }

    if (imageUrls.length > 10) {
      throw new ApiError("Maximum 10 images allowed", 400);
    }

    const result = await analyzeProductPhotos(imageUrls);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
