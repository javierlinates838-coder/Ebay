"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/profit-calculator";
import type { MarketResearch, PricingRecommendation } from "@/types";

interface MarketResearchCardProps {
  market: MarketResearch;
  pricing: PricingRecommendation;
}

export function MarketResearchCard({ market, pricing }: MarketResearchCardProps) {
  const TrendIcon =
    market.recentSalesTrend === "up"
      ? TrendingUp
      : market.recentSalesTrend === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    market.recentSalesTrend === "up"
      ? "text-green-600"
      : market.recentSalesTrend === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Market Research</CardTitle>
            <Badge variant="outline" className={`gap-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {market.recentSalesTrend}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Average Sold", value: formatCurrency(market.averageSoldPrice) },
              { label: "Highest Sold", value: formatCurrency(market.highestSoldPrice) },
              { label: "Lowest Sold", value: formatCurrency(market.lowestSoldPrice) },
              { label: "Comps Found", value: market.numberSold.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Suggested Buy It Now</p>
                <p className="text-xl font-bold">{formatCurrency(market.suggestedListingPrice)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Suggested Auction Start</p>
                <p className="text-xl font-bold">{formatCurrency(market.suggestedAuctionPrice)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">AI Pricing Engine</CardTitle>
          {pricing.underpricedOpportunity && (
            <Badge className="w-fit bg-green-600">Underpriced Opportunity</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Aggressive", price: pricing.aggressive, desc: "Max profit" },
              { label: "Market", price: pricing.market, desc: "Balanced" },
              { label: "Quick Sale", price: pricing.quickSale, desc: "Fast turnover" },
            ].map(({ label, price, desc }) => (
              <div key={label} className="rounded-xl border p-4 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{pricing.reasoning}</p>
        </CardContent>
      </Card>

      {market.soldComps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sold Comps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {market.soldComps.slice(0, 5).map((comp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="truncate pr-4">{comp.title}</span>
                  <span className="shrink-0 font-medium">{formatCurrency(comp.price)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
