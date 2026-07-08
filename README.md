# Logos — Advanced Bible Study

A beautiful, fast, and deeply educational Bible study web app. Read, search, and study all 66 books with original-language word study, translation comparison, guided reading plans, a memorization trainer, quizzes, and private highlights/notes — no account required.

## Features

- **Reader** — every chapter of all 66 books in 8 translations (KJV, WEB, ASV, YLT, LSV, BSB, Geneva 1599, Douay-Rheims), with poetry line breaks, translator footnotes, and clean serif typography.
- **Word study mode** — in Strong's-tagged translations (KJV, ASV), tap any word to open its full Greek (Thayer) or Hebrew (Brown-Driver-Briggs) lexicon entry with original script, transliteration, and cross-referenced entries.
- **Verse comparison** — any verse side-by-side across all 8 translations, plus a word-by-word original-language breakdown.
- **Book overviews** — author, date, genre, themes, summary, and a key verse for every book, with genre-colored library browsing.
- **Search** — full-text search across 31,000+ verses with exact-match counts and highlighted results.
- **Reading plans** — 7 curated plans (John in 21 days, Mark, Psalms of Comfort, a month of Proverbs, Romans deep dive, Genesis beginnings, a 30-day Gospel harmony) with day-by-day progress.
- **Memorization trainer** — 4 verse packs with three modes: read, first-letter prompts, and full typed recall with word-accuracy scoring; verses graduate from *new* to *mastered*.
- **Quiz** — 48-question bank across easy/medium/hard with explanations and references for every answer, plus lifetime stats.
- **My Study dashboard** — bookmarks, 5-color highlights, verse notes, chapters-read count, and a daily reading streak. All personal data stays in `localStorage`; nothing leaves the device.
- **Verse of the day** — rotates daily through 40 beloved verses.
- Light/dark themes with a warm, scholarly palette; fully responsive.

## Tech

- **Next.js 16** (App Router, Cache Components / PPR) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn-style Base UI components
- Scripture text and lexicon data fetched from the free [bolls.life](https://bolls.life) Bible API and cached server-side with `use cache`.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
