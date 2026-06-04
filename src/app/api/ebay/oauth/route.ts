import { NextRequest } from "next/server";
import { getEbayOAuthUrl, exchangeEbayCode, isEbayConfigured } from "@/lib/ebay/client";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (!isEbayConfigured() || !process.env.EBAY_REDIRECT_URI?.trim()) {
      throw new ApiError(
        "eBay OAuth is not configured. Add EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_ENV, and EBAY_REDIRECT_URI in Vercel environment variables.",
        503
      );
    }

    const state = crypto.randomUUID();
    const url = getEbayOAuthUrl(state);

    return Response.json({ url, state });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code) {
      return Response.json({ error: "Authorization code required" }, { status: 400 });
    }

    const tokens = await exchangeEbayCode(code);
    if (!tokens) {
      return Response.json({ error: "Failed to exchange authorization code" }, { status: 400 });
    }

    const supabase = await createClient();
    if (supabase && userId) {
      await supabase.from("ebay_connections").upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    }

    return Response.json({
      success: true,
      expiresIn: tokens.expires_in,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
