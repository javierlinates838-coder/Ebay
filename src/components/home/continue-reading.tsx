"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Flame } from "lucide-react";
import {
  getLastRead,
  getReadingDays,
  currentStreak,
  STUDY_EVENT,
  type LastRead,
} from "@/lib/study/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ContinueReading() {
  const [last, setLast] = useState<LastRead | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const update = () => {
      setLast(getLastRead());
      setStreak(currentStreak(getReadingDays()));
    };
    update();
    window.addEventListener(STUDY_EVENT, update);
    return () => window.removeEventListener(STUDY_EVENT, update);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button size="lg" render={<Link href={last ? `/bible/${last.bookSlug}/${last.chapter}` : "/bible/john/1"} />}>
        <BookOpen data-icon="inline-start" />
        {last ? `Continue: ${last.bookName} ${last.chapter}` : "Start reading"}
      </Button>
      <Button
        size="lg"
        variant="outline"
        render={<Link href="/plans" />}
      >
        Browse reading plans
      </Button>
      {streak > 0 && (
        <Badge variant="secondary" className="h-7 gap-1 px-3 text-sm">
          <Flame className="size-3.5 text-primary" />
          {streak}-day streak
        </Badge>
      )}
    </div>
  );
}
