"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import type { ReadingPlan } from "@/lib/bible/plans";
import { getPlanProgress, STUDY_EVENT } from "@/lib/study/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const LEVEL_VARIANT: Record<ReadingPlan["level"], string> = {
  Beginner: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  Intermediate: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  "Deep dive": "bg-sky-500/12 text-sky-700 dark:text-sky-400",
};

export function PlanGrid({ plans }: { plans: ReadingPlan[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const sync = () => {
      const next: Record<string, number> = {};
      for (const plan of plans) {
        next[plan.id] = getPlanProgress(plan.id).length;
      }
      setProgress(next);
    };
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, [plans]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => {
        const done = progress[plan.id] ?? 0;
        const pct = Math.round((done / plan.days.length) * 100);
        return (
          <Link
            key={plan.id}
            href={`/plans/${plan.id}`}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant="outline" className={`border-0 ${LEVEL_VARIANT[plan.level]}`}>
                    {plan.level}
                  </Badge>
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck className="size-3.5" />
                    {plan.days.length} days
                  </span>
                  <span>
                    {done > 0 ? `${done}/${plan.days.length} done · ${pct}%` : "Not started"}
                  </span>
                </div>
                <Progress value={pct} aria-label={`${plan.name} progress`} />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
