import { isEbayConfigured } from "@/lib/ebay/client";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const ebayOAuthReady =
    isEbayConfigured() && Boolean(process.env.EBAY_REDIRECT_URI?.trim());

  return Response.json({
    openai: isOpenAIConfigured(),
    ebay: ebayOAuthReady,
    ebayBrowse: isEbayConfigured(),
    photoroom: Boolean(process.env.PHOTOROOM_API_KEY?.trim()),
    supabase: isSupabaseConfigured(),
    demoMode: !isOpenAIConfigured() && !isEbayConfigured(),
  });
}
