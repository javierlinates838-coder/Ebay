import Link from "next/link";
import { Suspense } from "react";
import {
  BookOpenText,
  Search,
  CalendarCheck,
  Brain,
  GraduationCap,
  Headphones,
  Languages,
  Highlighter,
  Columns2,
} from "lucide-react";
import { BOOKS } from "@/lib/bible/books";
import { LANGUAGE_COUNT, TRANSLATIONS } from "@/lib/bible/translations";
import { PLANS } from "@/lib/bible/plans";
import { QUIZ_QUESTIONS } from "@/lib/bible/quiz";
import { VerseOfDay } from "@/components/home/verse-of-day";
import { ContinueReading } from "@/components/home/continue-reading";
import { LogoMark, Ornament } from "@/components/brand/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FEATURES = [
  {
    icon: BookOpenText,
    title: "Every book, every chapter",
    description: "All 66 books with scholarly overviews — author, date, themes, and a key verse for each.",
    href: "/bible",
  },
  {
    icon: Languages,
    title: "Greek & Hebrew word study",
    description: "Tap any word to open its Strong's lexicon entry with original language, transliteration, and full definition.",
    href: "/bible/john/1",
  },
  {
    icon: Columns2,
    title: `${TRANSLATIONS.length} translations, ${LANGUAGE_COUNT} languages`,
    description: "Read side-by-side in English, Español, Français, Deutsch, 中文, Русский, العربية, and more — including the original Hebrew and Greek.",
    href: "/bible/john/3/16",
  },
  {
    icon: Headphones,
    title: "Voice reader",
    description: "Listen to any chapter read aloud with verse-by-verse follow-along, speed control, and your choice of voice.",
    href: "/bible/psalms/23",
  },
  {
    icon: Search,
    title: "Powerful search",
    description: "Full-text search across the whole Bible with exact-match ranking and highlighted results.",
    href: "/search",
  },
  {
    icon: CalendarCheck,
    title: "Guided reading plans",
    description: `${PLANS.length} curated plans — from meeting Jesus in John to a month of Proverbs — with day-by-day progress.`,
    href: "/plans",
  },
  {
    icon: Brain,
    title: "Memorization trainer",
    description: "Flashcards, first-letter prompts, and type-it-out testing that move verses into long-term memory.",
    href: "/memorize",
  },
  {
    icon: GraduationCap,
    title: "Bible knowledge quiz",
    description: `${QUIZ_QUESTIONS.length}+ questions across difficulty levels with explanations and references for every answer.`,
    href: "/quiz",
  },
  {
    icon: Highlighter,
    title: "Highlights, notes & streaks",
    description: "Five highlight colors, verse notes, bookmarks, and a reading streak — auto-saved privately, with backup export/import.",
    href: "/dashboard",
  },
];

export default function HomePage() {
  const chapterCount = BOOKS.reduce((sum, b) => sum + b.chapters, 0);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden"
      >
        <div className="absolute top-[-12rem] left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[-4rem] left-[12%] h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-[2rem] right-[10%] h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <section className="flex flex-col items-center gap-6 py-14 text-center sm:py-20">
          <LogoMark id="logo-hero" className="size-16 drop-shadow-[0_6px_18px_rgba(201,145,59,0.4)] sm:size-20" />
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Study the Bible like never before
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground text-balance">
            {BOOKS.length} books. {chapterCount.toLocaleString()} chapters.{" "}
            {TRANSLATIONS.length} translations in {LANGUAGE_COUNT} languages.
            Original-language word study, voice reading, plans, memorization,
            and quizzes — beautifully in one place, free forever.
          </p>
          <ContinueReading />
          <Ornament className="mt-2" />
        </section>

      <section className="pb-12">
        <Suspense fallback={<Skeleton className="h-52 w-full rounded-xl" />}>
          <VerseOfDay />
        </Suspense>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight">
          Everything you need to go deeper
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="size-4.5" />
                  </span>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-8">
        <Card>
          <CardContent className="grid gap-6 py-4 text-center sm:grid-cols-4">
            {[
              { value: "66", label: "Books" },
              { value: chapterCount.toLocaleString(), label: "Chapters" },
              { value: "31,000+", label: "Verses" },
              { value: "14,000+", label: "Lexicon entries" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-3xl font-semibold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      </div>
    </div>
  );
}
