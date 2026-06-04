"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-nav";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsSummary } from "@/types";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => setAnalytics(data.analytics))
      .finally(() => setLoading(false));
  }, []);

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
          ) : analytics ? (
            <AnalyticsDashboard analytics={analytics} />
          ) : null}
        </div>
      </main>
    </>
  );
}
