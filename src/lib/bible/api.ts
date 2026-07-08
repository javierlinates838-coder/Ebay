import { cacheLife } from "next/cache";

const API = "https://bolls.life";

export interface ApiVerse {
  pk: number;
  verse: number;
  text: string;
  comment?: string;
}

export interface SearchResult {
  pk: number;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface SearchResponse {
  results: SearchResult[];
  exact_matches: number;
  total: number;
}

export interface LexiconEntry {
  topic: string;
  definition: string;
  lexeme?: string;
  transliteration?: string;
  pronunciation?: string;
  short_definition?: string;
}

const REQUEST_GAP_MS = 150;
const MAX_ATTEMPTS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The upstream API rate-limits aggressively; serialize requests with a small
// gap and retry with exponential backoff on 429/5xx. Successful responses are
// cached with `use cache`, so this throttle mostly matters at build time.
let lastRequest: Promise<unknown> = Promise.resolve();

async function throttledFetch(url: string, init?: RequestInit): Promise<Response> {
  const run = async () => {
    let res: Response | null = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(500 * 2 ** attempt);
      res = await fetch(url, init);
      if (res.status !== 429 && res.status < 500) return res;
    }
    return res!;
  };
  const turn = lastRequest.then(run, run);
  lastRequest = turn.then(
    () => sleep(REQUEST_GAP_MS),
    () => sleep(REQUEST_GAP_MS)
  );
  return turn;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await throttledFetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Bible API request failed (${res.status}): ${url}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch every verse of a chapter in the given translation. */
export async function getChapter(
  translation: string,
  bookId: number,
  chapter: number
): Promise<ApiVerse[]> {
  "use cache";
  cacheLife("max");
  return getJson<ApiVerse[]>(`${API}/get-text/${translation}/${bookId}/${chapter}/`);
}

/** Fetch a single verse. */
export async function getVerse(
  translation: string,
  bookId: number,
  chapter: number,
  verse: number
): Promise<ApiVerse> {
  "use cache";
  cacheLife("max");
  return getJson<ApiVerse>(`${API}/get-verse/${translation}/${bookId}/${chapter}/${verse}/`);
}

/** Fetch the same verses across several translations for comparison. */
export async function getParallelVerses(
  translations: string[],
  bookId: number,
  chapter: number,
  verses: number[]
): Promise<SearchResult[][]> {
  "use cache";
  cacheLife("max");
  const res = await throttledFetch(`${API}/get-paralel-verses/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ translations, book: bookId, chapter, verses }),
  });
  if (!res.ok) throw new Error(`Parallel verses request failed (${res.status})`);
  return res.json();
}

/** Full-text search within one translation. */
export async function searchBible(
  translation: string,
  query: string,
  limit = 40,
  offset = 0
): Promise<SearchResponse> {
  "use cache";
  cacheLife("days");
  const params = new URLSearchParams({
    search: query,
    limit: String(limit),
    offset: String(offset),
  });
  return getJson<SearchResponse>(`${API}/v2/find/${translation}?${params}`);
}

/**
 * Look up a Strong's number (e.g. "G25", "H7462") in the
 * Brown-Driver-Briggs / Thayer lexicon.
 */
export async function getLexiconEntry(strongs: string): Promise<LexiconEntry | null> {
  "use cache";
  cacheLife("max");
  const entries = await getJson<LexiconEntry[]>(
    `${API}/dictionary-definition/BDBT/${encodeURIComponent(strongs)}/`
  );
  return entries[0] ?? null;
}
