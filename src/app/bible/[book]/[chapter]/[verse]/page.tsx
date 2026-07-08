import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Languages } from "lucide-react";
import { getBookBySlug, type Book } from "@/lib/bible/books";
import { getParallelVerses, getChapter } from "@/lib/bible/api";
import { TRANSLATIONS } from "@/lib/bible/translations";
import { parseVerseText, plainVerseText } from "@/lib/bible/parse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function generateStaticParams() {
  return [
    { book: "john", chapter: "3", verse: "16" },
    { book: "psalms", chapter: "23", verse: "1" },
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/bible/[book]/[chapter]/[verse]">): Promise<Metadata> {
  const { book: slug, chapter, verse } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Verse not found" };
  return {
    title: `${book.name} ${chapter}:${verse} — Compare & Word Study`,
    description: `${book.name} ${chapter}:${verse} in ${TRANSLATIONS.length} translations with original-language word study.`,
  };
}

async function Comparison({ book, chapter, verse }: { book: Book; chapter: number; verse: number }) {
  const codes = TRANSLATIONS.map((t) => t.code);
  let rows: { code: string; name: string; text: string }[] = [];
  try {
    const result = await getParallelVerses(codes, book.id, chapter, [verse]);
    rows = result
      .map((verses, i) => ({
        code: codes[i],
        name: TRANSLATIONS[i].name,
        text: verses[0] ? plainVerseText(verses[0].text) : "",
      }))
      .filter((r) => r.text);
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground">
        Translation comparison is unavailable right now. Try again shortly.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <Card key={row.code} size="sm">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{row.code}</Badge>
              <span className="text-xs text-muted-foreground">{row.name}</span>
            </div>
            <p className="scripture">{row.text}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function WordStudy({ book, chapter, verse }: { book: Book; chapter: number; verse: number }) {
  const prefix = book.id <= 39 ? "H" : "G";
  let words: { text: string; code: string }[] = [];
  try {
    const verses = await getChapter("KJV", book.id, chapter);
    const target = verses.find((v) => v.verse === verse);
    if (target) {
      for (const seg of parseVerseText(target.text)) {
        if (seg.kind === "text" && seg.strongs?.length) {
          const text = seg.text.trim();
          if (text) words.push({ text, code: `${prefix}${seg.strongs[0]}` });
        }
      }
    }
  } catch {
    words = [];
  }

  if (words.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-4 text-primary" />
          Original language ({prefix === "H" ? "Hebrew" : "Greek"})
        </CardTitle>
        <CardDescription>
          Each phrase below is tagged with its Strong&apos;s number in the King
          James text. Tap one to open the full lexicon entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <Link
            key={`${w.code}-${i}`}
            href={`/lexicon/${w.code}`}
            className="group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="scripture">{w.text}</span>
            <span className="font-mono text-xs text-muted-foreground group-hover:text-accent-foreground">
              {w.code}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function VersePage({
  params,
}: PageProps<"/bible/[book]/[chapter]/[verse]">) {
  const { book: slug, chapter: chapterStr, verse: verseStr } = await params;
  const book = getBookBySlug(slug);
  const chapter = Number(chapterStr);
  const verse = Number(verseStr);
  if (
    !book ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > book.chapters ||
    !Number.isInteger(verse) ||
    verse < 1 ||
    verse > 200
  ) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <Link
          href={`/bible/${book.slug}/${chapter}#v${verse}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {book.name} {chapter}
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {book.name} {chapter}:{verse}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Side-by-side in {TRANSLATIONS.length} translations, with
          original-language word study.
        </p>
      </div>

      <Comparison book={book} chapter={chapter} verse={verse} />
      <WordStudy book={book} chapter={chapter} verse={verse} />
    </div>
  );
}
