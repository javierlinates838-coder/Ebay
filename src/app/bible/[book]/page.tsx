import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Feather, Quote } from "lucide-react";
import { BOOKS, GENRE_COLORS, getBookBySlug } from "@/lib/bible/books";
import { getVerse } from "@/lib/bible/api";
import { plainVerseText } from "@/lib/bible/parse";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function generateStaticParams() {
  return BOOKS.map((b) => ({ book: b.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/bible/[book]">): Promise<Metadata> {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Book not found" };
  return {
    title: `${book.name} — Overview & Chapters`,
    description: book.summary,
  };
}

async function KeyVerse({
  bookId,
  slug,
  reference,
  chapter,
  verse,
}: {
  bookId: number;
  slug: string;
  reference: string;
  chapter: number;
  verse: number;
}) {
  let text: string | null = null;
  try {
    const v = await getVerse("KJV", bookId, chapter, verse);
    text = plainVerseText(v.text);
  } catch {
    text = null;
  }
  if (!text) return null;
  return (
    <Card className="bg-accent/40">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
          <Quote className="size-4" />
          Key verse
        </div>
        <blockquote className="scripture text-lg italic">
          &ldquo;{text}&rdquo;
        </blockquote>
        <Link
          href={`/bible/${slug}/${chapter}#v${verse}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {reference} →
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function BookPage({ params }: PageProps<"/bible/[book]">) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/bible"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All books
      </Link>

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {book.name}
          </h1>
          <Badge className={cn("border-0", GENRE_COLORS[book.genre])} variant="outline">
            {book.genre}
          </Badge>
          <Badge variant="secondary">
            {book.testament === "OT" ? "Old Testament" : "New Testament"}
          </Badge>
        </div>
        <p className="max-w-3xl text-lg text-muted-foreground">{book.summary}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Feather className="size-4" /> {book.author}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" /> {book.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4" /> {book.chapters}{" "}
            {book.chapters === 1 ? "chapter" : "chapters"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {book.themes.map((theme) => (
            <Badge key={theme} variant="outline">
              {theme}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <KeyVerse
          bookId={book.id}
          slug={book.slug}
          reference={book.keyVerse.ref}
          chapter={book.keyVerse.chapter}
          verse={book.keyVerse.verse}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
              <Link
                key={ch}
                href={`/bible/${book.slug}/${ch}`}
                className="flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
              >
                {ch}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
