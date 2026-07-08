import type { Metadata } from "next";
import { MEMORY_PACKS } from "@/lib/bible/memory-verses";
import { PackGrid } from "@/components/memorize/pack-grid";

export const metadata: Metadata = {
  title: "Memorize Scripture",
  description:
    "Hide God's Word in your heart with flashcards, first-letter prompts, and type-it-out testing.",
};

export default function MemorizePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Memorize Scripture
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          &ldquo;Thy word have I hid in mine heart, that I might not sin against
          thee&rdquo; (Psalm 119:11). Work through a pack with three training
          modes — read, first letters, and full recall — and track each verse
          from new to mastered.
        </p>
      </div>
      <PackGrid packs={MEMORY_PACKS} />
    </div>
  );
}
