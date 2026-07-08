export interface VerseRef {
  bookId: number;
  bookSlug: string;
  ref: string;
  chapter: number;
  verse: number;
}

/**
 * A rotation of well-loved verses for the "Verse of the Day".
 * Selected by day-of-year so everyone sees the same verse on a given day.
 */
export const DAILY_VERSES: VerseRef[] = [
  { bookId: 43, bookSlug: "john", ref: "John 3:16", chapter: 3, verse: 16 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 23:1", chapter: 23, verse: 1 },
  { bookId: 20, bookSlug: "proverbs", ref: "Proverbs 3:5", chapter: 3, verse: 5 },
  { bookId: 45, bookSlug: "romans", ref: "Romans 8:28", chapter: 8, verse: 28 },
  { bookId: 50, bookSlug: "philippians", ref: "Philippians 4:13", chapter: 4, verse: 13 },
  { bookId: 23, bookSlug: "isaiah", ref: "Isaiah 40:31", chapter: 40, verse: 31 },
  { bookId: 24, bookSlug: "jeremiah", ref: "Jeremiah 29:11", chapter: 29, verse: 11 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 46:1", chapter: 46, verse: 1 },
  { bookId: 40, bookSlug: "matthew", ref: "Matthew 6:33", chapter: 6, verse: 33 },
  { bookId: 6, bookSlug: "joshua", ref: "Joshua 1:9", chapter: 1, verse: 9 },
  { bookId: 45, bookSlug: "romans", ref: "Romans 12:2", chapter: 12, verse: 2 },
  { bookId: 48, bookSlug: "galatians", ref: "Galatians 5:22", chapter: 5, verse: 22 },
  { bookId: 49, bookSlug: "ephesians", ref: "Ephesians 2:8", chapter: 2, verse: 8 },
  { bookId: 58, bookSlug: "hebrews", ref: "Hebrews 11:1", chapter: 11, verse: 1 },
  { bookId: 60, bookSlug: "1-peter", ref: "1 Peter 5:7", chapter: 5, verse: 7 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 119:105", chapter: 119, verse: 105 },
  { bookId: 43, bookSlug: "john", ref: "John 14:6", chapter: 14, verse: 6 },
  { bookId: 40, bookSlug: "matthew", ref: "Matthew 11:28", chapter: 11, verse: 28 },
  { bookId: 25, bookSlug: "lamentations", ref: "Lamentations 3:22", chapter: 3, verse: 22 },
  { bookId: 33, bookSlug: "micah", ref: "Micah 6:8", chapter: 6, verse: 8 },
  { bookId: 47, bookSlug: "2-corinthians", ref: "2 Corinthians 5:17", chapter: 5, verse: 17 },
  { bookId: 62, bookSlug: "1-john", ref: "1 John 4:19", chapter: 4, verse: 19 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 37:4", chapter: 37, verse: 4 },
  { bookId: 23, bookSlug: "isaiah", ref: "Isaiah 41:10", chapter: 41, verse: 10 },
  { bookId: 45, bookSlug: "romans", ref: "Romans 5:8", chapter: 5, verse: 8 },
  { bookId: 50, bookSlug: "philippians", ref: "Philippians 4:6", chapter: 4, verse: 6 },
  { bookId: 43, bookSlug: "john", ref: "John 16:33", chapter: 16, verse: 33 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 27:1", chapter: 27, verse: 1 },
  { bookId: 55, bookSlug: "2-timothy", ref: "2 Timothy 1:7", chapter: 1, verse: 7 },
  { bookId: 59, bookSlug: "james", ref: "James 1:5", chapter: 1, verse: 5 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 121:1", chapter: 121, verse: 1 },
  { bookId: 42, bookSlug: "luke", ref: "Luke 6:31", chapter: 6, verse: 31 },
  { bookId: 5, bookSlug: "deuteronomy", ref: "Deuteronomy 31:6", chapter: 31, verse: 6 },
  { bookId: 51, bookSlug: "colossians", ref: "Colossians 3:23", chapter: 3, verse: 23 },
  { bookId: 19, bookSlug: "psalms", ref: "Psalm 34:8", chapter: 34, verse: 8 },
  { bookId: 66, bookSlug: "revelation", ref: "Revelation 21:4", chapter: 21, verse: 4 },
  { bookId: 35, bookSlug: "habakkuk", ref: "Habakkuk 2:4", chapter: 2, verse: 4 },
  { bookId: 36, bookSlug: "zephaniah", ref: "Zephaniah 3:17", chapter: 3, verse: 17 },
  { bookId: 44, bookSlug: "acts", ref: "Acts 1:8", chapter: 1, verse: 8 },
  { bookId: 41, bookSlug: "mark", ref: "Mark 10:45", chapter: 10, verse: 45 },
];

export function verseForDay(date: Date): VerseRef {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}
