"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { BOOKS, GENRE_COLORS, type Genre, type Testament } from "@/lib/bible/books";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GENRES = [...new Set(BOOKS.map((b) => b.genre))];

export function BookExplorer() {
  const [query, setQuery] = useState("");
  const [testament, setTestament] = useState<"all" | Testament>("all");
  const [genre, setGenre] = useState<Genre | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BOOKS.filter((b) => {
      if (testament !== "all" && b.testament !== testament) return false;
      if (genre && b.genre !== genre) return false;
      if (q && !b.name.toLowerCase().includes(q) && !b.abbr.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, testament, genre]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Find a book…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
            aria-label="Filter books by name"
          />
        </div>
        <Tabs
          value={testament}
          onValueChange={(v) => setTestament(v as "all" | Testament)}
        >
          <TabsList>
            <TabsTrigger value="all">All 66</TabsTrigger>
            <TabsTrigger value="OT">Old Testament</TabsTrigger>
            <TabsTrigger value="NT">New Testament</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GENRES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGenre(genre === g ? null : g)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              GENRE_COLORS[g],
              genre === g
                ? "ring-2 ring-primary"
                : "opacity-80 hover:opacity-100"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No books match your filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/bible/${book.slug}`}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card size="sm" className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{book.name}</CardTitle>
                    <Badge className={cn("border-0", GENRE_COLORS[book.genre])} variant="outline">
                      {book.genre}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {book.summary}
                  </CardDescription>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"} · {book.author}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
