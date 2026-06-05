"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, TrendingUp, Package, Sparkles, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { useInventory } from "@/hooks/use-inventory";
import { formatCurrency } from "@/lib/profit-calculator";

export default function DashboardPage() {
  const { listings, loading } = useInventory();

  const stats = {
    total: listings.length,
    listed: listings.filter((l) => l.status === "listed").length,
    sold: listings.filter((l) => l.status === "sold" || l.status === "shipped").length,
    revenue: listings
      .filter((l) => l.status === "sold" || l.status === "shipped")
      .reduce((sum, l) => sum + (l.listing_price || 0), 0),
    profit: listings
      .filter((l) => l.status === "sold" || l.status === "shipped")
      .reduce((sum, l) => sum + (l.profit?.netProfit || 0), 0),
  };

  const quickActions = [
    {
      href: "/list",
      icon: PlusCircle,
      title: "New Listing",
      desc: "Upload photos & AI-generate listing",
      color: "from-[#0064D2]/20 to-[#0064D2]/5",
    },
    {
      href: "/inventory",
      icon: Package,
      title: "Inventory",
      desc: `${stats.total} items in your catalog`,
      color: "from-purple-500/20 to-purple-600/5",
    },
    {
      href: "/analytics",
      icon: TrendingUp,
      title: "Analytics",
      desc: "Track profits & performance",
      color: "from-green-500/20 to-green-600/5",
    },
  ];

  return (
    <>
      <AppHeader title="Dashboard" />
      <main className="flex-1 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-5xl space-y-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0064D2]/10 via-[#0064D2]/5 to-transparent p-6 sm:p-8">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#0064D2]">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">AI-Powered Reselling</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                List faster. Sell smarter.
              </h2>
              <p className="mt-2 max-w-lg text-muted-foreground">
                Snap photos, get AI identification, pricing, and a ready-to-paste eBay listing kit — no developer account needed.
              </p>
              <Link
                href="/list"
                className={cn(buttonVariants({ size: "lg" }), "mt-4 rounded-xl bg-[#0064D2] hover:bg-[#0053b3]")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Listing
              </Link>
            </div>
          </div>

          <SetupChecklist />

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total Items", value: stats.total },
              { label: "Active Listings", value: stats.listed },
              { label: "Items Sold", value: stats.sold },
              { label: "Total Profit", value: formatCurrency(stats.profit) },
            ].map(({ label, value }) => (
              <Card key={label} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{loading ? "—" : value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map(({ href, icon: Icon, title, desc, color }) => (
              <Link key={href} href={href}>
                <Card className={`h-full border-0 bg-gradient-to-br ${color} shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                  <CardContent className="pt-6">
                    <Icon className="mb-3 h-8 w-8 text-[#0064D2]" />
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {listings.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Listings</h3>
                <Link href="/inventory" className="text-sm text-[#0064D2] hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {listings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing.id}
                    href={
                      listing.status === "draft"
                        ? `/list?draft=${listing.id}`
                        : `/inventory`
                    }
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {(listing.enhanced_photos?.[0] || listing.photos?.[0]) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.enhanced_photos?.[0] || listing.photos[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{listing.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {listing.status}
                        </Badge>
                        {listing.status === "draft" && (
                          <span className="text-xs text-[#0064D2]">Resume →</span>
                        )}
                      </div>
                    </div>
                    {listing.listing_price && (
                      <span className="text-sm font-medium">
                        {formatCurrency(listing.listing_price)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </>
  );
}
