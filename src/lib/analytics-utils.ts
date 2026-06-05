import type { AnalyticsSummary, Listing } from "@/types";

export function computeAnalyticsFromListings(listings: Listing[]): AnalyticsSummary {
  const sold = listings.filter((l) => l.status === "sold" || l.status === "shipped");
  const listed = listings.filter(
    (l) => l.status === "listed" || l.status === "sold" || l.status === "shipped"
  );

  const totalRevenue = sold.reduce((sum, l) => sum + (l.listing_price || 0), 0);
  const totalProfit = sold.reduce((sum, l) => sum + (l.profit?.netProfit || 0), 0);

  const categoryMap = new Map<string, { count: number; revenue: number }>();
  for (const listing of listings) {
    const category = listing.category || "Uncategorized";
    const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
    categoryMap.set(category, {
      count: existing.count + 1,
      revenue: existing.revenue + (listing.listing_price || 0),
    });
  }

  const topCategories = [...categoryMap.entries()]
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const monthMap = new Map<string, { revenue: number; profit: number }>();
  for (const listing of sold) {
    const month = new Date(listing.updated_at).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const existing = monthMap.get(month) || { revenue: 0, profit: 0 };
    monthMap.set(month, {
      revenue: existing.revenue + (listing.listing_price || 0),
      profit: existing.profit + (listing.profit?.netProfit || 0),
    });
  }

  return {
    totalListings: listings.length,
    totalRevenue,
    averageProfit: sold.length > 0 ? totalProfit / sold.length : 0,
    sellThroughRate: listed.length > 0 ? (sold.length / listed.length) * 100 : 0,
    revenueByMonth: [...monthMap.entries()]
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6),
    topCategories,
  };
}

export function getEmptyAnalytics(): AnalyticsSummary {
  return {
    totalListings: 0,
    totalRevenue: 0,
    averageProfit: 0,
    sellThroughRate: 0,
    revenueByMonth: [],
    topCategories: [],
  };
}
