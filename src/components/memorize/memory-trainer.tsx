"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  Keyboard,
} from "lucide-react";
import type { MemoryPack, MemoryVerse } from "@/lib/bible/memory-verses";
import {
  getMemoryLevels,
  setMemoryLevel,
  STUDY_EVENT,
  type MemoryLevel,
} from "@/lib/study/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LEVEL_LABELS = ["New", "Learning", "Familiar", "Mastered"] as const;
const LEVEL_STYLES = [
  "bg-muted text-muted-foreground",
  "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
] as const;

type Mode = "read" | "letters" | "recall";

function firstLetters(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const match = word.match(/[a-zA-Z]/);
      if (!match) return word;
      const idx = word.indexOf(match[0]);
      return word.slice(0, idx + 1) + word.slice(idx + 1).replace(/[a-zA-Z]/g, "\u2022");
    })
    .join(" ");
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreRecall(target: string, attempt: string): number {
  const targetWords = normalizeWords(target);
  const attemptWords = normalizeWords(attempt);
  if (targetWords.length === 0) return 0;
  let matched = 0;
  for (let i = 0; i < targetWords.length; i++) {
    if (attemptWords[i] === targetWords[i]) matched++;
  }
  return Math.round((matched / targetWords.length) * 100);
}

export function MemoryTrainer({ pack }: { pack: MemoryPack }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("read");
  const [levels, setLevels] = useState<Record<string, MemoryLevel>>({});
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const verse: MemoryVerse = pack.verses[index];
  const level = levels[verse.id] ?? 0;

  useEffect(() => {
    const sync = () => setLevels(getMemoryLevels());
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, []);

  const goTo = (nextIndex: number) => {
    setIndex(nextIndex);
    setRevealed(false);
    setAttempt("");
    setScore(null);
  };

  const grade = (knewIt: boolean) => {
    const next = (knewIt ? Math.min(level + 1, 3) : Math.max(level - 1, 0)) as MemoryLevel;
    setMemoryLevel(verse.id, next);
    if (index < pack.verses.length - 1) goTo(index + 1);
  };

  const lettersText = useMemo(() => firstLetters(verse.text), [verse.text]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setRevealed(false); setScore(null); }}>
          <TabsList>
            <TabsTrigger value="read">
              <Eye className="size-3.5" /> Read
            </TabsTrigger>
            <TabsTrigger value="letters">
              <Lightbulb className="size-3.5" /> First letters
            </TabsTrigger>
            <TabsTrigger value="recall">
              <Keyboard className="size-3.5" /> Recall
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground">
          Verse {index + 1} of {pack.verses.length}
        </span>
      </div>

      <Card>
        <CardContent className="flex min-h-64 flex-col gap-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold">{verse.ref}</h2>
            <Badge variant="outline" className={cn("border-0", LEVEL_STYLES[level])}>
              {LEVEL_LABELS[level]}
            </Badge>
            <Link
              href={`/bible/${verse.bookSlug}/${verse.chapter}#v${verse.verse}`}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <BookOpen className="size-3.5" />
              In context
            </Link>
          </div>

          {mode === "read" && (
            <p className="scripture text-xl leading-9">{verse.text}</p>
          )}

          {mode === "letters" && (
            <>
              <p className="scripture text-xl leading-9 tracking-wide">
                {revealed ? verse.text : lettersText}
              </p>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setRevealed((v) => !v)}
              >
                <Eye data-icon="inline-start" />
                {revealed ? "Hide full text" : "Reveal full text"}
              </Button>
            </>
          )}

          {mode === "recall" && (
            <>
              <Textarea
                value={attempt}
                onChange={(e) => setAttempt(e.target.value)}
                placeholder="Type the verse from memory…"
                rows={4}
                className="scripture text-base"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setScore(scoreRecall(verse.text, attempt))}>
                  Check my answer
                </Button>
                {score !== null && (
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      score >= 90
                        ? "text-emerald-600 dark:text-emerald-400"
                        : score >= 60
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {score}% word-perfect
                    {score >= 90 ? " — excellent!" : score >= 60 ? " — almost there" : " — keep practicing"}
                  </span>
                )}
              </div>
              {score !== null && (
                <p className="scripture rounded-lg bg-muted/60 p-3 text-base">
                  {verse.text}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous verse"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next verse"
            disabled={index === pack.verses.length - 1}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => grade(false)}>
            Still learning
          </Button>
          <Button onClick={() => grade(true)}>I knew it</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pack.verses.map((v, i) => {
          const lv = levels[v.id] ?? 0;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to ${v.ref}`}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                LEVEL_STYLES[lv],
                i === index && "ring-2 ring-primary"
              )}
            >
              {v.ref}
            </button>
          );
        })}
      </div>
    </div>
  );
}
