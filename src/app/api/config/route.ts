import { isEbayConfigured } from "@/lib/ebay/client";
import { getAIProviderName, isAIConfigured } from "@/lib/ai/client";
import {
  isSupabaseConfigured,
  isSupabaseStorageReady,
} from "@/lib/supabase/server";

export async function GET() {
  const ebayOAuthReady =
    isEbayConfigured() && Boolean(process.env.EBAY_REDIRECT_URI?.trim());

  return Response.json({
    ai: isAIConfigured(),
    aiProvider: getAIProviderName(),
    gemini: Boolean(
      process.env.GEMINI_API_KEY?.trim() ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    ),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    ebay: ebayOAuthReady,
    ebayBrowse: isEbayConfigured(),
    photoroom: Boolean(process.env.PHOTOROOM_API_KEY?.trim()),
    supabase: isSupabaseConfigured(),
    supabaseStorage: isSupabaseStorageReady(),
    demoMode: !isAIConfigured() && !isEbayConfigured(),
  });
}
