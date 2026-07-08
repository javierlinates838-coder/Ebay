import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import { searchBible } from "@/lib/bible/api";
import { getBookById } from "@/lib/bible/books";
import { DEFAULT_TRANSLATION, TRANSLATIONS, isValidTranslation } from "@/lib/bible/translations";
import { plainVerseText } from "@/lib/bible/parse";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Search the Bible",
  description: "Full-text search across the whole Bible with highlighted, ranked results.",
};

function splitMarked(raw: string): { text: string; marked: boolean }[] {
  // Keep <mark> emphasis from the search API, strip everything else.
  const cleaned = plainVerseText(
    raw.replace(/<mark>/gi, "\u0001").replace(/<\/mark>/gi, "\u0002")
  );
  const chunks: { text: string; marked: boolean }[] = [];
  let marked = false;
  for (const part of cleaned.split(/([\u0001\u0002])/)) {
    if (part === "\u0001") marked = true;
    else if (part === "\u0002") marked = false;
    else if (part) chunks.push({ text: part, marked });
  }
  return chunks;
}

function HighlightedText({ raw }: { raw: string }) {
  return (
    <>
      {splitMarked(raw).map((chunk, i) =>
        chunk.marked ? (
          <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-inherit">
            {chunk.text}
          </mark>
        ) : (
          <span key={i}>{chunk.text}</span>
        )
      )}
    </>
  );
}

async function Results({ query, translation }: { query: string; translation: string }) {
  let data;
  try {
    data = await searchBible(translation, query, 40);
  } catch {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Search is unavailable right now. Please try again shortly.
      </p>
    );
  }

  if (data.results.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No verses found for &ldquo;{query}&rdquo; in {translation}. Try
        different words or another translation.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {data.total.toLocaleString()} result{data.total === 1 ? "" : "s"}
        {data.exact_matches > 0 && ` · ${data.exact_matches.toLocaleString()} exact`}
        {data.total > 40 && " · showing the first 40"}
      </p>
      {data.results.map((r) => {
        const book = getBookById(r.book);
        if (!book) return null;
        return (
          <Link
            key={r.pk}
            href={`/bible/${book.slug}/${r.chapter}#v${r.verse}`}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card size="sm" className="transition-shadow group-hover:shadow-md">
              <CardContent className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {book.name} {r.chapter}:{r.verse}
                  </span>
                  <Badge variant="secondary">{translation}</Badge>
                </div>
                <p className="scripture text-[1rem] leading-7">
                  <HighlightedText raw={r.text} />
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

async function SearchContent({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const requested = typeof query.t === "string" ? query.t.toUpperCase() : DEFAULT_TRANSLATION;
  const translation = isValidTranslation(requested) ? requested : DEFAULT_TRANSLATION;

  return (
    <>
      <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="e.g. love one another, shepherd, grace…"
            className="h-10 pl-8"
            aria-label="Search the Bible"
            required
          />
        </div>
        <div className="flex gap-2">
          <select
            name="t"
            defaultValue={translation}
            aria-label="Translation"
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {TRANSLATIONS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.code} — {t.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" className="h-10">
            Search
          </Button>
        </div>
      </form>

      <div className="mt-8">
        {q ? (
          <Results query={q} translation={translation} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="mb-4">Search all 31,000+ verses. A few ideas:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["faith hope love", "do not fear", "shepherd", "kingdom of God", "grace", "wisdom"].map(
                (idea) => (
                  <Link
                    key={idea}
                    href={`/search?q=${encodeURIComponent(idea)}`}
                    className="rounded-full border px-3 py-1 text-sm hover:border-primary hover:bg-accent hover:text-accent-foreground"
                  >
                    {idea}
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Search the Scriptures
        </h1>
        <p className="mt-1 text-muted-foreground">
          &ldquo;Seek and ye shall find&rdquo; — full-text search across every
          verse.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        }
      >
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
