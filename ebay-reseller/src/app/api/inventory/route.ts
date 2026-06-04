import { NextRequest } from "next/server";
import { handleApiError, parseJsonBody, ApiError } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingStatus } from "@/types";

const DEMO_USER_ID = "demo-user";

async function getUserId(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || DEMO_USER_ID;
  } catch {
    return DEMO_USER_ID;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ListingStatus | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const userId = await getUserId();

    try {
      const supabase = await createClient();
      let query = supabase
        .from("listings")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq("status", status);
      if (search) query = query.ilike("title", `%${search}%`);

      const { data, count, error } = await query;

      if (!error && data) {
        return Response.json({ listings: data, total: count, page, limit });
      }
    } catch {
      // Fall through to empty response
    }

    return Response.json({ listings: [], total: 0, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<Partial<Listing>>(request);
    const userId = await getUserId();

    const listing = {
      user_id: userId,
      title: body.title || "Untitled Listing",
      description: body.description,
      status: body.status || "draft",
      product_analysis: body.product_analysis,
      market_research: body.market_research,
      generated_listing: body.generated_listing,
      pricing: body.pricing,
      profit: body.profit,
      photos: body.photos || [],
      enhanced_photos: body.enhanced_photos || [],
      category: body.category,
      listing_price: body.listing_price,
      cost_of_goods: body.cost_of_goods,
      keywords: body.keywords,
      item_specifics: body.item_specifics,
    };

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("listings")
        .insert(listing)
        .select()
        .single();

      if (!error && data) {
        return Response.json({ listing: data }, { status: 201 });
      }
    } catch {
      // Fall through
    }

    const mockListing: Listing = {
      id: crypto.randomUUID(),
      ...listing,
      user_id: userId,
      ebay_item_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Listing;

    return Response.json({ listing: mockListing }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody<{ id: string } & Partial<Listing>>(request);

    if (!body.id) {
      throw new ApiError("Listing ID is required", 400);
    }

    const { id, ...updates } = body;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return Response.json({ listing: data });
      }
    } catch {
      // Fall through
    }

    return Response.json({ listing: { id, ...updates } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ApiError("Listing ID is required", 400);
    }

    try {
      const supabase = await createClient();
      await supabase.from("listings").delete().eq("id", id);
    } catch {
      // Fall through
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
