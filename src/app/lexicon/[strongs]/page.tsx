import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Languages, SearchIcon } from "lucide-react";
import { getLexiconEntry } from "@/lib/bible/api";
import { sanitizeLexiconHtml } from "@/lib/bible/lexicon-html";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STRONGS_RE = /^[GH]\d{1,5}$/;

export function generateStaticParams() {
  return [{ strongs: "G26" }, { strongs: "H7462" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/lexicon/[strongs]">): Promise<Metadata> {
  const { strongs } = await params;
  const code = strongs.toUpperCase();
  return {
    title: `Strong's ${code} — Lexicon`,
    description: `Original-language definition for Strong's number ${code} from the Brown-Driver-Briggs and Thayer lexicons.`,
  };
}

export default async function LexiconPage({ params }: PageProps<"/lexicon/[strongs]">) {
  const { strongs } = await params;
  const code = strongs.toUpperCase();
  if (!STRONGS_RE.test(code)) notFound();

  const entry = await getLexiconEntry(code).catch(() => null);
  if (!entry) notFound();

  const isHebrew = code.startsWith("H");
  const html = sanitizeLexiconHtml(entry.definition);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/bible"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Languages className="size-5" />
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Strong&apos;s {code}
        </h1>
        <Badge variant="secondary">{isHebrew ? "Hebrew (Old Testament)" : "Greek (New Testament)"}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lexicon entry</CardTitle>
          <CardDescription>
            From the {isHebrew ? "Brown-Driver-Briggs Hebrew lexicon" : "Thayer's Greek lexicon"} with
            Strong&apos;s cross-references — related entries are tappable links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="text-[0.95rem] leading-7 [&_[data-lang]]:font-serif [&_[data-lang]]:text-lg [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-3 [&_b]:font-semibold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" render={<Link href="/search" />}>
          <SearchIcon data-icon="inline-start" />
          Search where this word appears
        </Button>
        <Button variant="outline" render={<Link href="/bible" />}>
          Keep reading
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Tip: turn on <span className="font-medium">Word study mode</span> in any
        KJV or ASV chapter to tap words and jump straight to their lexicon
        entries.
      </p>
    </div>
  );
}
