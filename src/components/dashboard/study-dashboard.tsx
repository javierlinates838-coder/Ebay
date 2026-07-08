"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark as BookmarkIcon,
  BookOpenCheck,
  CalendarCheck,
  Flame,
  Highlighter,
  NotebookPen,
  Trash2,
} from "lucide-react";
import { PLANS } from "@/lib/bible/plans";
import {
  currentStreak,
  getBookmarks,
  getChaptersRead,
  getHighlights,
  getNotes,
  getPlanProgress,
  getReadingDays,
  removeHighlight,
  saveNote,
  toggleBookmark,
  STUDY_EVENT,
  type Bookmark,
  type Highlight,
  type Note,
} from "@/lib/study/storage";
import { cn } from "@/lib/utils";
import { DataBackup } from "@/components/dashboard/data-backup";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HL_DOT: Record<string, string> = {
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  rose: "bg-rose-400",
  violet: "bg-violet-400",
};

interface DashboardData {
  bookmarks: Bookmark[];
  highlights: Highlight[];
  notes: Note[];
  streak: number;
  daysRead: number;
  readingDays: string[];
  chaptersRead: number;
  plans: { id: string; name: string; done: number; total: number }[];
}

export function StudyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const sync = () => {
      const days = getReadingDays();
      setData({
        bookmarks: Object.values(getBookmarks()).sort((a, b) => b.createdAt - a.createdAt),
        highlights: Object.values(getHighlights()).sort((a, b) => b.createdAt - a.createdAt),
        notes: Object.values(getNotes()).sort((a, b) => b.updatedAt - a.updatedAt),
        streak: currentStreak(days),
        daysRead: days.length,
        readingDays: days,
        chaptersRead: Object.keys(getChaptersRead()).length,
        plans: PLANS.map((p) => ({
          id: p.id,
          name: p.name,
          done: getPlanProgress(p.id).length,
          total: p.days.length,
        })).filter((p) => p.done > 0),
      });
    };
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, []);

  if (!data) {
    return <p className="py-12 text-center text-muted-foreground">Loading your study data…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Flame className="size-5" />
            </span>
            <div>
              <div className="font-heading text-2xl font-semibold">{data.streak} days</div>
              <div className="text-xs text-muted-foreground">Current streak</div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <BookOpenCheck className="size-5" />
            </span>
            <div>
              <div className="font-heading text-2xl font-semibold">{data.chaptersRead}</div>
              <div className="text-xs text-muted-foreground">Chapters read</div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <div className="font-heading text-2xl font-semibold">{data.daysRead}</div>
              <div className="text-xs text-muted-foreground">Days in the Word</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StreakCalendar days={data.readingDays} />

      {data.plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active reading plans</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.plans.map((p) => (
              <div key={p.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <Link href={`/plans/${p.id}`} className="font-medium hover:text-primary hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {p.done}/{p.total}
                  </span>
                </div>
                <Progress value={(p.done / p.total) * 100} aria-label={`${p.name} progress`} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bookmarks">
        <TabsList>
          <TabsTrigger value="bookmarks">
            <BookmarkIcon className="size-3.5" />
            Bookmarks ({data.bookmarks.length})
          </TabsTrigger>
          <TabsTrigger value="highlights">
            <Highlighter className="size-3.5" />
            Highlights ({data.highlights.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookPen className="size-3.5" />
            Notes ({data.notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className="mt-4">
          {data.bookmarks.length === 0 ? (
            <EmptyState text="Tap a verse while reading and choose Bookmark to save it here." />
          ) : (
            <div className="flex flex-col gap-3">
              {data.bookmarks.map((b) => (
                <Card key={b.id} size="sm">
                  <CardContent className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/bible/${b.bookSlug}/${b.chapter}#v${b.verse}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {b.bookName} {b.chapter}:{b.verse}
                      </Link>
                      <p className="scripture mt-1 line-clamp-2 text-[1rem]">{b.text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove bookmark"
                      onClick={() =>
                        toggleBookmark({
                          id: b.id,
                          bookId: b.bookId,
                          bookSlug: b.bookSlug,
                          bookName: b.bookName,
                          chapter: b.chapter,
                          verse: b.verse,
                          text: b.text,
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          {data.highlights.length === 0 ? (
            <EmptyState text="Tap a verse while reading and pick a color to highlight it." />
          ) : (
            <div className="flex flex-col gap-2">
              {data.highlights.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className={cn("size-3 shrink-0 rounded-full", HL_DOT[h.color])} />
                  <Link
                    href={`/bible/${h.bookSlug}/${h.chapter}#v${h.verse}`}
                    className="flex-1 text-sm font-medium hover:text-primary hover:underline"
                  >
                    {h.bookName} {h.chapter}:{h.verse}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove highlight"
                    onClick={() => removeHighlight(h.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {data.notes.length === 0 ? (
            <EmptyState text="Tap a verse while reading and choose Note to journal your thoughts." />
          ) : (
            <div className="flex flex-col gap-3">
              {data.notes.map((n) => (
                <Card key={n.id} size="sm">
                  <CardContent className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/bible/${n.bookSlug}/${n.chapter}#v${n.verse}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {n.bookName} {n.chapter}:{n.verse}
                      </Link>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                        {n.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete note"
                      onClick={() =>
                        saveNote({
                          id: n.id,
                          bookId: n.bookId,
                          bookSlug: n.bookSlug,
                          bookName: n.bookName,
                          chapter: n.chapter,
                          verse: n.verse,
                          content: "",
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DataBackup />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <CardDescription className="py-6 text-center">{text}</CardDescription>
      </CardContent>
    </Card>
  );
}
