import Link from "next/link";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { getChapter } from "@/lib/bible/api";
import { BOOKS, type Book } from "@/lib/bible/books";
import { parseVerseText, plainVerseText } from "@/lib/bible/parse";
import { getTranslation } from "@/lib/bible/translations";
import { VerseList, type VerseData } from "@/components/reader/verse-list";
import { TranslationPicker } from "@/components/reader/translation-picker";
import { KeyboardNav } from "@/components/reader/keyboard-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Neighbor {
  href: string;
  label: string;
}

function neighbors(book: Book, chapter: number, translation: string): { prev: Neighbor | null; next: Neighbor | null } {
  const suffix = translation === "KJV" ? "" : `?t=${translation}`;
  const index = BOOKS.findIndex((b) => b.id === book.id);

  let prev: Neighbor | null = null;
  if (chapter > 1) {
    prev = { href: `/bible/${book.slug}/${chapter - 1}${suffix}`, label: `${book.name} ${chapter - 1}` };
  } else if (index > 0) {
    const p = BOOKS[index - 1];
    prev = { href: `/bible/${p.slug}/${p.chapters}${suffix}`, label: `${p.name} ${p.chapters}` };
  }

  let next: Neighbor | null = null;
  if (chapter < book.chapters) {
    next = { href: `/bible/${book.slug}/${chapter + 1}${suffix}`, label: `${book.name} ${chapter + 1}` };
  } else if (index < BOOKS.length - 1) {
    const n = BOOKS[index + 1];
    next = { href: `/bible/${n.slug}/1${suffix}`, label: `${n.name} 1` };
  }

  return { prev, next };
}

function ChapterNav({
  prev,
  next,
  translation,
}: {
  prev: Neighbor | null;
  next: Neighbor | null;
  translation?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {prev ? (
        <Button variant="outline" size="sm" render={<Link href={prev.href} />}>
          <ChevronLeft data-icon="inline-start" />
          {prev.label}
        </Button>
      ) : (
        <span />
      )}
      {translation && <TranslationPicker current={translation} />}
      {next ? (
        <Button variant="outline" size="sm" render={<Link href={next.href} />}>
          {next.label}
          <ChevronRight data-icon="inline-end" />
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}

export async function ChapterReader({
  book,
  chapter,
  translation,
}: {
  book: Book;
  chapter: number;
  translation: string;
}) {
  const info = getTranslation(translation);
  const { prev, next } = neighbors(book, chapter, info.code);

  // Original-language sources cover a single testament.
  const outOfScope =
    (info.scope === "OT" && book.testament === "NT") ||
    (info.scope === "NT" && book.testament === "OT");

  let verses: VerseData[] = [];
  if (!outOfScope) {
    const raw = await getChapter(info.code, book.id, chapter);
    verses = (Array.isArray(raw) ? raw : []).map((v) => ({
      verse: v.verse,
      segments: parseVerseText(v.text),
      plain: plainVerseText(v.text),
    }));
  }

  if (outOfScope || verses.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <ChapterNav prev={prev} next={next} translation={info.code} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Globe className="size-8 text-primary" />
            <p className="font-medium">
              {info.name} doesn&apos;t include {book.name}.
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {info.scope === "OT"
                ? "The Hebrew source text covers the Old Testament only."
                : info.scope === "NT"
                  ? "The Greek source text covers the New Testament only."
                  : "This chapter isn't available in the selected translation."}{" "}
              Pick another translation above, or continue in the King James
              Version.
            </p>
            <Button render={<Link href={`/bible/${book.slug}/${chapter}`} />}>
              Read in KJV
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <KeyboardNav prevHref={prev?.href ?? null} nextHref={next?.href ?? null} />
      <ChapterNav prev={prev} next={next} translation={info.code} />

      <p className="text-xs text-muted-foreground">
        {info.name} · {verses.length} verses · tap any verse to highlight,
        bookmark, note, copy, or compare · use ← → keys to change chapters
      </p>

      <VerseList
        bookId={book.id}
        bookSlug={book.slug}
        bookName={book.name}
        chapter={chapter}
        strongsPrefix={book.id <= 39 ? "H" : "G"}
        hasStrongs={info.strongs}
        lang={info.lang}
        rtl={info.rtl ?? false}
        verses={verses}
      />

      <ChapterNav prev={prev} next={next} />
    </div>
  );
}
