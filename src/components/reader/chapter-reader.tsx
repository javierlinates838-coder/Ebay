import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getChapter } from "@/lib/bible/api";
import { BOOKS, type Book } from "@/lib/bible/books";
import { parseVerseText, plainVerseText } from "@/lib/bible/parse";
import { getTranslation } from "@/lib/bible/translations";
import { VerseList, type VerseData } from "@/components/reader/verse-list";
import { TranslationPicker } from "@/components/reader/translation-picker";
import { Button } from "@/components/ui/button";

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
  const raw = await getChapter(info.code, book.id, chapter);
  const verses: VerseData[] = raw.map((v) => ({
    verse: v.verse,
    segments: parseVerseText(v.text),
    plain: plainVerseText(v.text),
  }));

  const { prev, next } = neighbors(book, chapter, info.code);

  return (
    <div className="flex flex-col gap-6">
      <ChapterNav prev={prev} next={next} translation={info.code} />

      <p className="text-xs text-muted-foreground">
        {info.name} · {verses.length} verses · tap any verse to highlight,
        bookmark, note, copy, or compare
      </p>

      <VerseList
        bookId={book.id}
        bookSlug={book.slug}
        bookName={book.name}
        chapter={chapter}
        strongsPrefix={book.id <= 39 ? "H" : "G"}
        hasStrongs={info.strongs}
        verses={verses}
      />

      <ChapterNav prev={prev} next={next} />
    </div>
  );
}
