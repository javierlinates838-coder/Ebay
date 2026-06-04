export type ListingStatus = "draft" | "listed" | "sold" | "shipped";

export interface ProductAnalysis {
  product: string;
  brand: string;
  model: string;
  color: string;
  condition: string;
  category: string;
  confidence: number;
  itemSpecifics: Record<string, string>;
}

export interface MarketResearch {
  averageSoldPrice: number;
  highestSoldPrice: number;
  lowestSoldPrice: number;
  numberSold: number;
  recentSalesTrend: "up" | "down" | "stable";
  suggestedListingPrice: number;
  suggestedAuctionPrice: number;
  soldComps: SoldComp[];
}

export interface SoldComp {
  title: string;
  price: number;
  soldDate: string;
  condition?: string;
}

export interface PricingRecommendation {
  aggressive: number;
  market: number;
  quickSale: number;
  underpricedOpportunity: boolean;
  reasoning: string;
}

export interface GeneratedListing {
  title: string;
  description: string;
  itemSpecifics: Record<string, string>;
  keywords: string[];
  shippingSuggestions: {
    weight: string;
    dimensions: string;
    recommendedService: string;
    estimatedCost: number;
  };
}

export interface ProfitBreakdown {
  salePrice: number;
  shippingCost: number;
  ebayFees: number;
  taxes: number;
  costOfGoods: number;
  netProfit: number;
  roiPercentage: number;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ListingStatus;
  product_analysis: ProductAnalysis | null;
  market_research: MarketResearch | null;
  generated_listing: GeneratedListing | null;
  pricing: PricingRecommendation | null;
  profit: ProfitBreakdown | null;
  photos: string[];
  enhanced_photos: string[];
  ebay_item_id: string | null;
  category: string | null;
  listing_price: number | null;
  cost_of_goods: number | null;
  keywords: string[] | null;
  item_specifics: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalListings: number;
  totalRevenue: number;
  averageProfit: number;
  sellThroughRate: number;
  revenueByMonth: { month: string; revenue: number; profit: number }[];
  topCategories: { category: string; count: number; revenue: number }[];
}

export interface EbayTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
