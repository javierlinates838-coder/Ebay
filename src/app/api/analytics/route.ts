import { handleApiError } from "@/lib/api-utils";
import { getInventoryClient, DEMO_USER_ID } from "@/lib/supabase/server";
import type { AnalyticsSummary, Listing } from "@/types";

export async function GET() {
  try {
    const supabase = getInventoryClient();

    if (supabase) {
      const { data: listings, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", DEMO_USER_ID);

      if (!error && listings?.length) {
        return Response.json({ analytics: computeAnalytics(listings as Listing[]) });
      }
    }

    return Response.json({ analytics: getDemoAnalytics() });
  } catch (error) {
    return handleApiError(error);
  }
}

function computeAnalytics(listings: Listing[]): AnalyticsSummary {
  const sold = listings.filter((l) => l.status === "sold" || l.status === "shipped");
  const listed = listings.filter((l) => l.status === "listed" || l.status === "sold" || l.status === "shipped");

  const totalRevenue = sold.reduce((sum, l) => sum + (l.listing_price || 0), 0);
  const totalProfit = sold.reduce((sum, l) => sum + (l.profit?.netProfit || 0), 0);

  const categoryMap = new Map<string, { count: number; revenue: number }>();
  for (const l of listings) {
    const cat = l.category || "Uncategorized";
    const existing = categoryMap.get(cat) || { count: 0, revenue: 0 };
    categoryMap.set(cat, {
      count: existing.count + 1,
      revenue: existing.revenue + (l.listing_price || 0),
    });
  }

  const topCategories = [...categoryMap.entries()]
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const monthMap = new Map<string, { revenue: number; profit: number }>();
  for (const l of sold) {
    const month = new Date(l.updated_at).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const existing = monthMap.get(month) || { revenue: 0, profit: 0 };
    monthMap.set(month, {
      revenue: existing.revenue + (l.listing_price || 0),
      profit: existing.profit + (l.profit?.netProfit || 0),
    });
  }

  return {
    totalListings: listings.length,
    totalRevenue,
    averageProfit: sold.length > 0 ? totalProfit / sold.length : 0,
    sellThroughRate: listed.length > 0 ? (sold.length / listed.length) * 100 : 0,
    revenueByMonth: [...monthMap.entries()].map(([month, data]) => ({ month, ...data })),
    topCategories,
  };
}

function getDemoAnalytics(): AnalyticsSummary {
  return {
    totalListings: 47,
    totalRevenue: 3842.5,
    averageProfit: 28.75,
    sellThroughRate: 68.4,
    revenueByMonth: [
      { month: "Jan 2026", revenue: 420, profit: 112 },
      { month: "Feb 2026", revenue: 680, profit: 198 },
      { month: "Mar 2026", revenue: 890, profit: 245 },
      { month: "Apr 2026", revenue: 1120, profit: 312 },
      { month: "May 2026", revenue: 732.5, profit: 189 },
    ],
    topCategories: [
      { category: "Electronics", count: 18, revenue: 1540 },
      { category: "Clothing", count: 12, revenue: 890 },
      { category: "Collectibles", count: 8, revenue: 720 },
      { category: "Home & Garden", count: 6, revenue: 452.5 },
      { category: "Sports", count: 3, revenue: 240 },
    ],
  };
}
