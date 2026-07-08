"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WEEKS = 18;
const DAY_MS = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** GitHub-style heatmap of the last ~4 months of reading days. */
export function StreakCalendar({ days }: { days: string[] }) {
  const read = new Set(days);
  const today = new Date();

  // End the grid on the current day; start WEEKS*7-1 days earlier, then snap
  // back to a Sunday so columns align to calendar weeks.
  const start = new Date(today.getTime() - (WEEKS * 7 - 1) * DAY_MS);
  start.setDate(start.getDate() - start.getDay());

  const weeks: { date: Date; iso: string; future: boolean }[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: { date: Date; iso: string; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cursor),
        iso: isoDay(cursor),
        future: cursor > today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const readThisPeriod = weeks.flat().filter((c) => !c.future && read.has(c.iso)).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reading calendar</CardTitle>
        <CardDescription>
          {readThisPeriod > 0
            ? `${readThisPeriod} day${readThisPeriod === 1 ? "" : "s"} in the Word over the last ${WEEKS} weeks — every square is a day you read.`
            : "Read any chapter and today's square turns gold. Come back tomorrow to start a streak."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell) => (
                <div
                  key={cell.iso}
                  title={`${cell.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}${read.has(cell.iso) ? " — read" : ""}`}
                  className={cn(
                    "size-3 rounded-[3px]",
                    cell.future
                      ? "bg-transparent"
                      : read.has(cell.iso)
                        ? "bg-primary"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
