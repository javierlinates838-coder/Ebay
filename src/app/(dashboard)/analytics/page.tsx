"use client";

import { useMemo } from "react";
import { AppHeader } from "@/components/layout/app-nav";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventory } from "@/hooks/use-inventory";
import { computeAnalyticsFromListings, getEmptyAnalytics } from "@/lib/analytics-utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { listings, loading } = useInventory();

  const analytics = useMemo(() => {
    if (!listings.length) return getEmptyAnalytics();
    return computeAnalyticsFromListings(listings);
  }, [listings]);

  return (
    <>
      <AppHeader title="Analytics" />
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-xl" />
            </div>
          ) : listings.length === 0 ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  No inventory data yet. Create listings and mark them as sold to see analytics here.
                </AlertDescription>
              </Alert>
              <Link href="/list" className={cn(buttonVariants(), "rounded-xl bg-[#0064D2] hover:bg-[#0053b3]")}>
                Create Your First Listing
              </Link>
              <AnalyticsDashboard analytics={analytics} />
            </div>
          ) : (
            <AnalyticsDashboard analytics={analytics} />
          )}
        </div>
      </main>
    </>
  );
}
