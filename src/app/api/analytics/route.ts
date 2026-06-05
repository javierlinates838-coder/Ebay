import { handleApiError } from "@/lib/api-utils";
import { getInventoryClient, DEMO_USER_ID } from "@/lib/supabase/server";
import { computeAnalyticsFromListings, getEmptyAnalytics } from "@/lib/analytics-utils";
import type { Listing } from "@/types";

export async function GET() {
  try {
    const supabase = getInventoryClient();

    if (supabase) {
      const { data: listings, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", DEMO_USER_ID);

      if (!error && listings?.length) {
        return Response.json({
          analytics: computeAnalyticsFromListings(listings as Listing[]),
        });
      }
    }

    return Response.json({ analytics: getEmptyAnalytics() });
  } catch (error) {
    return handleApiError(error);
  }
}
