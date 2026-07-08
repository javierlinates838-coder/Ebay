"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bookmark as BookmarkIcon,
  Copy,
  Eraser,
  Headphones,
  Languages,
  NotebookPen,
  Columns2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from "lucide-react";
import { useSpeech } from "@/lib/speech/use-speech";
import type { Segment } from "@/lib/bible/parse";
import {
  getBookmarks,
  getHighlights,
  getNotes,
  recordReading,
  removeHighlight,
  saveNote,
  setHighlight,
  toggleBookmark,
  verseKey,
  STUDY_EVENT,
  type HighlightColor,
} from "@/lib/study/storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface VerseData {
  verse: number;
  segments: Segment[];
  plain: string;
}

interface VerseListProps {
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  /** "H" for Hebrew (OT), "G" for Greek (NT) */
  strongsPrefix: "H" | "G";
  hasStrongs: boolean;
  verses: VerseData[];
}

const HIGHLIGHT_COLORS: { color: HighlightColor; className: string; swatch: string }[] = [
  { color: "amber", className: "hl-amber", swatch: "bg-amber-400" },
  { color: "emerald", className: "hl-emerald", swatch: "bg-emerald-400" },
  { color: "sky", className: "hl-sky", swatch: "bg-sky-400" },
  { color: "rose", className: "hl-rose", swatch: "bg-rose-400" },
  { color: "violet", className: "hl-violet", swatch: "bg-violet-400" },
];

export function VerseList({
  bookId,
  bookSlug,
  bookName,
  chapter,
  strongsPrefix,
  hasStrongs,
  verses,
}: VerseListProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wordStudy, setWordStudy] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, { color: HighlightColor }>>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [noted, setNoted] = useState<Set<string>>(new Set());
  const [noteVerse, setNoteVerse] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const speech = useSpeech();
  const listRef = useRef<HTMLDivElement>(null);

  const speakingVerse =
    speech.currentIndex !== null ? verses[speech.currentIndex]?.verse : null;

  // Keep the verse being read aloud in view.
  useEffect(() => {
    if (speakingVerse === null || speech.status !== "playing") return;
    listRef.current
      ?.querySelector(`#v${speakingVerse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [speakingVerse, speech.status]);

  const playFrom = (index: number) => {
    speech.play(
      verses.map((v) => v.plain),
      index
    );
  };

  useEffect(() => {
    recordReading(bookSlug, bookName, chapter);
  }, [bookSlug, bookName, chapter]);

  useEffect(() => {
    const sync = () => {
      setHighlights(getHighlights());
      setBookmarked(new Set(Object.keys(getBookmarks())));
      setNoted(new Set(Object.keys(getNotes())));
    };
    sync();
    window.addEventListener(STUDY_EVENT, sync);
    return () => window.removeEventListener(STUDY_EVENT, sync);
  }, []);

  const openNote = (verse: number) => {
    const key = verseKey(bookId, chapter, verse);
    setNoteDraft(getNotes()[key]?.content ?? "");
    setNoteVerse(verse);
  };

  const copyVerse = async (v: VerseData) => {
    try {
      await navigator.clipboard.writeText(
        `"${v.plain}" — ${bookName} ${chapter}:${v.verse}`
      );
      toast.success(`Copied ${bookName} ${chapter}:${v.verse}`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div ref={listRef}>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {speech.supported && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (speech.status === "idle" ? playFrom(0) : speech.stop())}
          >
            {speech.status === "idle" ? (
              <Headphones data-icon="inline-start" />
            ) : (
              <Square data-icon="inline-start" />
            )}
            {speech.status === "idle" ? "Listen to this chapter" : "Stop listening"}
          </Button>
        )}
        {hasStrongs && (
          <div className="flex items-center gap-2">
            <Switch
              id="word-study"
              checked={wordStudy}
              onCheckedChange={setWordStudy}
            />
            <Label htmlFor="word-study" className="flex items-center gap-1.5 text-sm">
              <Languages className="size-4 text-primary" />
              Word study mode
              <span className="hidden text-muted-foreground sm:inline">
                — tap underlined words for Greek/Hebrew
              </span>
            </Label>
          </div>
        )}
      </div>

      <div className="scripture flex flex-col">
        {verses.map((v) => {
          const key = verseKey(bookId, chapter, v.verse);
          const hl = highlights[key];
          const hlClass = hl
            ? HIGHLIGHT_COLORS.find((c) => c.color === hl.color)?.className
            : undefined;
          const isSelected = selected === v.verse;

          return (
            <div key={v.verse} id={`v${v.verse}`} className="scroll-mt-24">
              <p
                onClick={() => setSelected(isSelected ? null : v.verse)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 transition-colors hover:bg-muted/60",
                  hlClass,
                  isSelected && "ring-2 ring-primary/40",
                  speakingVerse === v.verse && "bg-accent/70 ring-2 ring-primary/60"
                )}
              >
                <span className="verse-num">{v.verse}</span>
                <VerseText
                  segments={v.segments}
                  wordStudy={wordStudy}
                  strongsPrefix={strongsPrefix}
                />
                {noted.has(key) && (
                  <NotebookPen className="ml-1.5 inline size-3.5 text-primary/70" aria-label="Has note" />
                )}
                {bookmarked.has(key) && (
                  <BookmarkIcon className="ml-1 inline size-3.5 fill-primary/70 text-primary/70" aria-label="Bookmarked" />
                )}
              </p>

              {isSelected && (
                <div className="mx-2 mb-2 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 font-sans shadow-sm">
                  <div className="flex items-center gap-1">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        aria-label={`Highlight ${c.color}`}
                        onClick={() => {
                          if (hl?.color === c.color) {
                            removeHighlight(key);
                          } else {
                            setHighlight({
                              id: key,
                              bookId,
                              bookSlug,
                              bookName,
                              chapter,
                              verse: v.verse,
                              color: c.color,
                            });
                          }
                        }}
                        className={cn(
                          "size-5 rounded-full transition-transform hover:scale-110",
                          c.swatch,
                          hl?.color === c.color && "ring-2 ring-foreground/60 ring-offset-1"
                        )}
                      />
                    ))}
                    {hl && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove highlight"
                        onClick={() => removeHighlight(key)}
                      >
                        <Eraser />
                      </Button>
                    )}
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const added = toggleBookmark({
                        id: key,
                        bookId,
                        bookSlug,
                        bookName,
                        chapter,
                        verse: v.verse,
                        text: v.plain,
                      });
                      toast.success(added ? "Bookmark added" : "Bookmark removed");
                    }}
                  >
                    <BookmarkIcon
                      data-icon="inline-start"
                      className={cn(bookmarked.has(key) && "fill-current")}
                    />
                    {bookmarked.has(key) ? "Saved" : "Bookmark"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openNote(v.verse)}>
                    <NotebookPen data-icon="inline-start" />
                    Note
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyVerse(v)}>
                    <Copy data-icon="inline-start" />
                    Copy
                  </Button>
                  {speech.supported && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        playFrom(verses.findIndex((x) => x.verse === v.verse));
                        setSelected(null);
                      }}
                    >
                      <Volume2 data-icon="inline-start" />
                      Listen from here
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/bible/${bookSlug}/${chapter}/${v.verse}`} />}
                  >
                    <Columns2 data-icon="inline-start" />
                    Compare
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {speech.status !== "idle" && (
        <div className="glass fixed inset-x-0 bottom-0 z-40 border-t">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous verse"
                onClick={() => speech.skip(-1)}
              >
                <SkipBack />
              </Button>
              <Button
                variant="default"
                size="icon"
                aria-label={speech.status === "playing" ? "Pause" : "Resume"}
                onClick={() =>
                  speech.status === "playing" ? speech.pause() : speech.resume()
                }
              >
                {speech.status === "playing" ? <Pause /> : <Play />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next verse"
                onClick={() => speech.skip(1)}
              >
                <SkipForward />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Stop listening"
                onClick={speech.stop}
              >
                <Square />
              </Button>
            </div>

            <span className="text-sm font-medium">
              {bookName} {chapter}
              {speakingVerse !== null && `:${speakingVerse}`}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <select
                value={speech.rate}
                onChange={(e) => speech.setRate(Number(e.target.value))}
                aria-label="Reading speed"
                className="h-7 rounded-lg border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {[0.8, 1, 1.2, 1.5].map((r) => (
                  <option key={r} value={r}>
                    {r}× speed
                  </option>
                ))}
              </select>
              {speech.voices.length > 1 && (
                <select
                  value={speech.voiceURI ?? ""}
                  onChange={(e) => speech.setVoiceURI(e.target.value)}
                  aria-label="Voice"
                  className="h-7 max-w-36 rounded-lg border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {speech.voiceURI === null && <option value="">Default voice</option>}
                  {speech.voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={noteVerse !== null} onOpenChange={(open) => !open && setNoteVerse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Note on {bookName} {chapter}:{noteVerse}
            </DialogTitle>
            <DialogDescription>
              Saved privately on this device. Clear the text to delete the note.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="What is God showing you in this verse?"
            rows={5}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (noteVerse === null) return;
                saveNote({
                  id: verseKey(bookId, chapter, noteVerse),
                  bookId,
                  bookSlug,
                  bookName,
                  chapter,
                  verse: noteVerse,
                  content: noteDraft,
                });
                toast.success(noteDraft.trim() ? "Note saved" : "Note deleted");
                setNoteVerse(null);
              }}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerseText({
  segments,
  wordStudy,
  strongsPrefix,
}: {
  segments: Segment[];
  wordStudy: boolean;
  strongsPrefix: "H" | "G";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "break") return <br key={i} />;
        if (seg.kind === "note") {
          if (!wordStudy) return null;
          return (
            <sup key={i} className="mx-0.5 font-sans text-[0.6rem] text-muted-foreground">
              [{seg.text}]
            </sup>
          );
        }
        const content = seg.bold ? <b>{seg.text}</b> : seg.text;
        if (wordStudy && seg.strongs?.length) {
          const code = `${strongsPrefix}${seg.strongs[0]}`;
          return (
            <span key={i}>
              <Link
                href={`/lexicon/${code}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-sm underline decoration-primary/50 decoration-dotted underline-offset-4 hover:bg-accent hover:text-accent-foreground"
                title={`Strong's ${code}`}
              >
                {content}
              </Link>
            </span>
          );
        }
        return <span key={i}>{content}</span>;
      })}
    </>
  );
}
