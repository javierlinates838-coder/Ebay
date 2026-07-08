import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBookBySlug } from "@/lib/bible/books";
import { DEFAULT_TRANSLATION, isValidTranslation } from "@/lib/bible/translations";
import { ChapterReader } from "@/components/reader/chapter-reader";
import { Skeleton } from "@/components/ui/skeleton";

export function generateStaticParams() {
  return [
    { book: "john", chapter: "1" },
    { book: "john", chapter: "3" },
    { book: "psalms", chapter: "23" },
    { book: "genesis", chapter: "1" },
    { book: "romans", chapter: "8" },
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/bible/[book]/[chapter]">): Promise<Metadata> {
  const { book: slug, chapter } = await params;
  const book = getBookBySlug(slug);
  if (!book) return { title: "Chapter not found" };
  return {
    title: `${book.name} ${chapter}`,
    description: `Read ${book.name} chapter ${chapter} with word-by-word Greek and Hebrew study, highlights, notes, and translation comparison.`,
  };
}

function ReaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
      ))}
    </div>
  );
}

async function ReaderSection({
  params,
  searchParams,
}: {
  params: PageProps<"/bible/[book]/[chapter]">["params"];
  searchParams: PageProps<"/bible/[book]/[chapter]">["searchParams"];
}) {
  const [{ book: slug, chapter: chapterStr }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const book = getBookBySlug(slug);
  const chapter = Number(chapterStr);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    notFound();
  }

  const requested = typeof query.t === "string" ? query.t.toUpperCase() : DEFAULT_TRANSLATION;
  const translation = isValidTranslation(requested) ? requested : DEFAULT_TRANSLATION;

  return <ChapterReader book={book} chapter={chapter} translation={translation} />;
}

async function ChapterHeading({
  params,
}: {
  params: PageProps<"/bible/[book]/[chapter]">["params"];
}) {
  const { book: slug, chapter } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();
  return (
    <div className="mb-6">
      <Link
        href={`/bible/${book.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        {book.name} — {book.genre}
      </Link>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {book.name} {chapter}
      </h1>
    </div>
  );
}

export default function ChapterPage({
  params,
  searchParams,
}: PageProps<"/bible/[book]/[chapter]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<Skeleton className="mb-6 h-14 w-56" />}>
        <ChapterHeading params={params} />
      </Suspense>
      <Suspense fallback={<ReaderSkeleton />}>
        <ReaderSection params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
