"use client";

/**
 * All personal study data lives in localStorage under the `logos.` prefix.
 * A "study" event is dispatched on every write so open components can sync.
 */

export const STUDY_EVENT = "logos-study-change";

export type HighlightColor = "amber" | "emerald" | "sky" | "rose" | "violet";

export interface Highlight {
  id: string; // `${bookId}:${chapter}:${verse}`
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: number;
}

export interface Note {
  id: string;
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  updatedAt: number;
}

export interface LastRead {
  bookSlug: string;
  bookName: string;
  chapter: number;
  at: number;
}

export interface QuizStats {
  played: number;
  correct: number;
  answered: number;
  bestStreak: number;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`logos.${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(`logos.${key}`, JSON.stringify(value));
    window.dispatchEvent(new Event(STUDY_EVENT));
  } catch {
    // storage full or unavailable — personal data is best-effort
  }
}

export function verseKey(bookId: number, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

// ----- Highlights -----

export function getHighlights(): Record<string, Highlight> {
  return read("highlights", {});
}

export function setHighlight(h: Omit<Highlight, "createdAt">) {
  const all = getHighlights();
  all[h.id] = { ...h, createdAt: Date.now() };
  write("highlights", all);
}

export function removeHighlight(id: string) {
  const all = getHighlights();
  delete all[id];
  write("highlights", all);
}

// ----- Bookmarks -----

export function getBookmarks(): Record<string, Bookmark> {
  return read("bookmarks", {});
}

export function toggleBookmark(b: Omit<Bookmark, "createdAt">): boolean {
  const all = getBookmarks();
  if (all[b.id]) {
    delete all[b.id];
    write("bookmarks", all);
    return false;
  }
  all[b.id] = { ...b, createdAt: Date.now() };
  write("bookmarks", all);
  return true;
}

// ----- Notes -----

export function getNotes(): Record<string, Note> {
  return read("notes", {});
}

export function saveNote(n: Omit<Note, "updatedAt">) {
  const all = getNotes();
  if (n.content.trim()) {
    all[n.id] = { ...n, updatedAt: Date.now() };
  } else {
    delete all[n.id];
  }
  write("notes", all);
}

// ----- Reading position & streak -----

export function getLastRead(): LastRead | null {
  return read("lastRead", null);
}

export function recordReading(bookSlug: string, bookName: string, chapter: number) {
  write("lastRead", { bookSlug, bookName, chapter, at: Date.now() } satisfies LastRead);
  const days = read<string[]>("readingDays", []);
  const today = new Date().toISOString().slice(0, 10);
  if (!days.includes(today)) {
    days.push(today);
    write("readingDays", days.slice(-730));
  }
  const chapters = read<Record<string, number>>("chaptersRead", {});
  chapters[`${bookSlug}:${chapter}`] = Date.now();
  write("chaptersRead", chapters);
}

export function getReadingDays(): string[] {
  return read("readingDays", []);
}

export function getChaptersRead(): Record<string, number> {
  return read("chaptersRead", {});
}

/** Consecutive days ending today or yesterday. */
export function currentStreak(days: string[]): number {
  const set = new Set(days);
  const day = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  // Streak may end yesterday without breaking (today not read yet).
  if (!set.has(iso(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (set.has(iso(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

// ----- Reading plans -----

export function getPlanProgress(planId: string): number[] {
  return read(`plan.${planId}`, []);
}

export function togglePlanDay(planId: string, day: number): number[] {
  const done = new Set(getPlanProgress(planId));
  if (done.has(day)) done.delete(day);
  else done.add(day);
  const next = [...done].sort((a, b) => a - b);
  write(`plan.${planId}`, next);
  return next;
}

export function getStartedPlans(): string[] {
  if (typeof window === "undefined") return [];
  const ids: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith("logos.plan.")) {
      const id = key.slice("logos.plan.".length);
      if (getPlanProgress(id).length > 0) ids.push(id);
    }
  }
  return ids;
}

// ----- Memorization -----

export type MemoryLevel = 0 | 1 | 2 | 3; // new → learning → familiar → mastered

export function getMemoryLevels(): Record<string, MemoryLevel> {
  return read("memory", {});
}

export function setMemoryLevel(verseId: string, level: MemoryLevel) {
  const all = getMemoryLevels();
  all[verseId] = level;
  write("memory", all);
}

// ----- Quiz -----

export function getQuizStats(): QuizStats {
  return read("quiz", { played: 0, correct: 0, answered: 0, bestStreak: 0 });
}

export function recordQuizRound(correct: number, answered: number, bestStreak: number) {
  const s = getQuizStats();
  write("quiz", {
    played: s.played + 1,
    correct: s.correct + correct,
    answered: s.answered + answered,
    bestStreak: Math.max(s.bestStreak, bestStreak),
  } satisfies QuizStats);
}

// ----- Backup: export / import / reset -----

const PREFIX = "logos.";

/** Serialize every piece of study data to a JSON backup string. */
export function exportStudyData(): string {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      data[key.slice(PREFIX.length)] = JSON.parse(window.localStorage.getItem(key) ?? "null");
    } catch {
      // skip unreadable entries
    }
  }
  return JSON.stringify(
    { app: "logos-bible", version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2
  );
}

/** Restore a backup produced by `exportStudyData`. Returns entry count. */
export function importStudyData(json: string): number {
  const parsed = JSON.parse(json) as { app?: string; data?: Record<string, unknown> };
  if (parsed.app !== "logos-bible" || typeof parsed.data !== "object" || !parsed.data) {
    throw new Error("Not a valid Logos backup file");
  }
  let count = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    count++;
  }
  window.dispatchEvent(new Event(STUDY_EVENT));
  return count;
}

/** Delete all study data on this device. */
export function resetStudyData() {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new Event(STUDY_EVENT));
}
