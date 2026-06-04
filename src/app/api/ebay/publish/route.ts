import { NextRequest } from "next/server";
import { publishToEbay } from "@/lib/ebay/client";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<{
      listingId: string;
      userId?: string;
      accessToken?: string;
    }>(request);

    if (!body.listingId) {
      throw new ApiError("Listing ID is required", 400);
    }

    let accessToken = body.accessToken;

    if (!accessToken && body.userId) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("ebay_connections")
        .select("access_token")
        .eq("user_id", body.userId)
        .single();
      accessToken = data?.access_token;
    }

    if (!accessToken) {
      throw new ApiError("eBay account not connected. Please connect your eBay account first.", 401);
    }

    const supabase = await createClient();
    const { data: listing, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", body.listingId)
      .single();

    if (error || !listing) {
      throw new ApiError("Listing not found", 404);
    }

    const result = await publishToEbay(accessToken, {
      title: listing.title,
      description: listing.description || "",
      price: listing.listing_price || listing.market_research?.suggestedListingPrice || 0,
      photos: listing.enhanced_photos?.length ? listing.enhanced_photos : listing.photos,
      category: listing.category || undefined,
      itemSpecifics: listing.item_specifics || undefined,
    });

    if ("error" in result) {
      throw new ApiError(result.error, 500);
    }

    await supabase
      .from("listings")
      .update({ status: "listed", ebay_item_id: result.itemId })
      .eq("id", body.listingId);

    return Response.json({ success: true, ebayItemId: result.itemId });
  } catch (error) {
    return handleApiError(error);
  }
}
