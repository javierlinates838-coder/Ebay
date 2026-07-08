import type { Metadata } from "next";
import { BookExplorer } from "@/components/bible/book-explorer";

export const metadata: Metadata = {
  title: "The Library — All 66 Books",
  description:
    "Browse every book of the Bible with genre, author, date, themes, and chapter counts.",
};

export default function BiblePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          The Library
        </h1>
        <p className="mt-1 text-muted-foreground">
          One divine story told through 66 books — law, history, poetry,
          prophecy, gospel, and letters. Choose a book to see its overview and
          start reading.
        </p>
      </div>
      <BookExplorer />
    </div>
  );
}
