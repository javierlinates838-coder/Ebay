"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain } from "lucide-react";
import type { MemoryPack } from "@/lib/bible/memory-verses";
import { getMemoryLevels, STUDY_EVENT, type MemoryLevel } from "@/lib/study/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PackGrid({ packs }: { packs: MemoryPack[] }) {
  const [levels, setLevels] = useState<Record<string, MemoryLevel>>({});

  useEffect(() => {
    const sync = () => setLevels(getMemoryLevels());
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {packs.map((pack) => {
        const mastered = pack.verses.filter((v) => (levels[v.id] ?? 0) === 3).length;
        const pct = Math.round((mastered / pack.verses.length) * 100);
        return (
          <Link
            key={pack.id}
            href={`/memorize/${pack.id}`}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Brain className="size-4.5" />
                </span>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pack.verses.length} verses</span>
                  <span>
                    {mastered > 0 ? `${mastered} mastered · ${pct}%` : "Not started"}
                  </span>
                </div>
                <Progress value={pct} aria-label={`${pack.name} progress`} />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
