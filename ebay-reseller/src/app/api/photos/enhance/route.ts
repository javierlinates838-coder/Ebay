import { NextRequest } from "next/server";
import { enhancePhoto } from "@/lib/photoroom/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      image: string;
      removeBackground?: boolean;
      improveQuality?: boolean;
    }>(request);

    if (!body.image) {
      throw new ApiError("Image data is required", 400);
    }

    const result = await enhancePhoto(body.image, {
      removeBackground: body.removeBackground ?? true,
      improveQuality: body.improveQuality ?? true,
    });

    if ("error" in result) {
      throw new ApiError(result.error, 500);
    }

    return Response.json({ enhancedImage: result.enhancedImage });
  } catch (error) {
    return handleApiError(error);
  }
}
