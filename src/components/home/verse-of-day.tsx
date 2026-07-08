import Link from "next/link";
import { cacheLife } from "next/cache";
import { Sparkles } from "lucide-react";
import { getVerse } from "@/lib/bible/api";
import { verseForDay } from "@/lib/bible/daily-verses";
import { plainVerseText } from "@/lib/bible/parse";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeakButton } from "@/components/speech/speak-button";

export async function VerseOfDay() {
  "use cache";
  cacheLife("hours");

  const ref = verseForDay(new Date());
  let text: string;
  try {
    const verse = await getVerse("KJV", ref.bookId, ref.chapter, ref.verse);
    text = plainVerseText(verse.text);
  } catch {
    text = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.";
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/10 blur-3xl" />
      <CardContent className="flex flex-col gap-4 py-2">
        <Badge variant="secondary" className="w-fit gap-1">
          <Sparkles className="size-3" />
          Verse of the day
        </Badge>
        <blockquote className="scripture text-xl leading-9 sm:text-2xl sm:leading-10">
          &ldquo;{text}&rdquo;
        </blockquote>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/bible/${ref.bookSlug}/${ref.chapter}#v${ref.verse}`}
            className="font-heading text-sm font-semibold text-primary hover:underline"
          >
            {ref.ref} — Read in context →
          </Link>
          <SpeakButton text={`${ref.ref}. ${text}`} size="xs" variant="ghost" />
        </div>
      </CardContent>
    </Card>
  );
}
