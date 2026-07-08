"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import type { ReadingPlan } from "@/lib/bible/plans";
import { getPlanProgress, togglePlanDay, STUDY_EVENT } from "@/lib/study/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PlanTracker({ plan }: { plan: ReadingPlan }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    const sync = () => setDone(new Set(getPlanProgress(plan.id)));
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, [plan.id]);

  const pct = Math.round((done.size / plan.days.length) * 100);
  const nextDay = plan.days.find((d) => !done.has(d.day));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {done.size === plan.days.length ? (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <PartyPopper className="size-4" />
                  Plan complete — well done!
                </span>
              ) : (
                `${done.size} of ${plan.days.length} days complete`
              )}
            </span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} aria-label="Plan progress" />
          {nextDay && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-sm text-muted-foreground">
                Up next — Day {nextDay.day}: {nextDay.title}
              </span>
              <Button
                size="sm"
                render={
                  <Link
                    href={`/bible/${nextDay.readings[0].bookSlug}/${nextDay.readings[0].chapter}`}
                  />
                }
              >
                <BookOpen data-icon="inline-start" />
                Read now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ol className="flex flex-col gap-2">
        {plan.days.map((day) => {
          const isDone = done.has(day.day);
          return (
            <li
              key={day.day}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                isDone && "border-primary/30 bg-accent/40"
              )}
            >
              <button
                type="button"
                aria-label={
                  isDone ? `Mark day ${day.day} as not done` : `Mark day ${day.day} as done`
                }
                onClick={() => togglePlanDay(plan.id, day.day)}
                className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {isDone ? (
                  <CheckCircle2 className="size-6 text-primary" />
                ) : (
                  <Circle className="size-6 text-muted-foreground/50 hover:text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", isDone && "text-muted-foreground line-through")}>
                  Day {day.day} — {day.title}
                </p>
                <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  {day.readings.map((r, i) => (
                    <Link
                      key={i}
                      href={`/bible/${r.bookSlug}/${r.chapter}`}
                      className="hover:text-primary hover:underline"
                    >
                      {r.label}
                    </Link>
                  ))}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
