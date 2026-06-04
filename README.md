# ResellAI — AI-Powered eBay Reseller Assistant

A production-ready Next.js application that helps eBay resellers list items faster and maximize profits using AI.

## Features

- **AI Photo Analysis** — Upload 1-10 photos; AI identifies product, brand, model, color, condition, and category with confidence scores
- **Market Research** — Search eBay sold listings for average/highest/lowest prices, trends, and suggested pricing
- **AI Listing Generator** — SEO-optimized titles, descriptions, item specifics, keywords, and shipping suggestions
- **Photo Enhancer** — Background removal and image enhancement via PhotoRoom API (with client-side fallback)
- **Profit Calculator** — Sale price, shipping, eBay fees, taxes, net profit, and ROI
- **Inventory Dashboard** — Store, search, and track listings (Draft, Listed, Sold, Shipped)
- **One-Click eBay Listing** — OAuth connection and direct publishing to eBay
- **AI Pricing Engine** — Aggressive, market, and quick-sale pricing with underpriced opportunity detection
- **Analytics** — Revenue charts, sell-through rate, average profit, top categories
- **Mobile-First UI** — Apple-inspired design with dark mode and smooth animations

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + shadcn/ui
- **Supabase** (PostgreSQL, Auth, Storage)
- **Google Gemini** (via Vercel AI SDK) — primary AI provider
- **OpenAI GPT-4o** (optional alternative)
- **eBay Developer API** (optional — demo data used without keys)
- **PhotoRoom API** (background removal)
- **Vercel** (deployment)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

### 3. Set up Supabase

In your [Supabase](https://supabase.com/) project SQL editor, run both migrations:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_remove_auth_user_fk.sql`

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Recommended setup (Gemini + Supabase, no eBay keys)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (for real AI) | Google Gemini key from [AI Studio](https://aistudio.google.com/apikey) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for cloud inventory) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, for saving listings) |

### Optional

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Alternative to Gemini for AI features |
| `EBAY_CLIENT_ID` | eBay Developer App ID — skip if you don't have developer access |
| `EBAY_CLIENT_SECRET` | eBay Developer Cert ID |
| `EBAY_REDIRECT_URI` | OAuth redirect (e.g. `https://yourapp.vercel.app/api/ebay/callback`) |
| `EBAY_ENV` | `sandbox` or `production` |
| `PHOTOROOM_API_KEY` | PhotoRoom background removal |

## Demo Mode

**eBay keys are optional.** Without them, market research and publish use simulated data — you can still list items, run AI analysis, and save inventory.

**For AI:** add `GEMINI_API_KEY` on Vercel for real photo analysis and listing generation.

**For cloud inventory:** add all three Supabase keys and run the SQL migrations.

Check **Settings** in the app to confirm which integrations are active.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/javierlinates838-coder/Ebay)

1. Import the `javierlinates838-coder/Ebay` repository in Vercel.
2. Vercel auto-detects Next.js — no root directory override needed.
3. Add environment variables from `.env.example` in the Vercel project settings.
4. Deploy.

For eBay OAuth, set `EBAY_REDIRECT_URI` to your production URL, for example:

```text
https://your-project.vercel.app/api/ebay/callback
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Dashboard, list, inventory, analytics, settings
│   ├── api/             # API routes (AI, eBay, photos, inventory)
│   └── page.tsx         # Landing page
├── components/
│   ├── analytics/
│   ├── inventory/
│   ├── layout/
│   ├── listing/
│   └── ui/              # shadcn components
├── hooks/
├── lib/
│   ├── ai/
│   ├── ebay/
│   ├── photoroom/
│   └── supabase/
└── types/
```

## License

MIT
