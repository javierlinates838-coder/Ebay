import { checkAIHealth } from "@/lib/ai/health-check";
import { handleApiError } from "@/lib/api-utils";

export const maxDuration = 45;

export async function GET() {
  try {
    const health = await checkAIHealth();
    return Response.json(health, { status: health.ok ? 200 : 503 });
  } catch (error) {
    return handleApiError(error);
  }
}
