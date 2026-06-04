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
- **OpenAI GPT-4o** (via Vercel AI SDK)
- **eBay Developer API** (Browse + Sell APIs)
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

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for photo analysis and listing generation |
| `EBAY_CLIENT_ID` | eBay Developer App ID (Client ID) |
| `EBAY_CLIENT_SECRET` | eBay Developer Cert ID (Client Secret) |
| `EBAY_REDIRECT_URI` | OAuth redirect URI (e.g. `https://yourapp.vercel.app/api/ebay/callback`) |
| `EBAY_ENV` | `sandbox` or `production` |
| `PHOTOROOM_API_KEY` | PhotoRoom API key for background removal |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

## Demo Mode

**You do not need to add any environment variables to use the app.** Without API keys, it runs in demo mode with:

- Mock AI product analysis
- Simulated market research data
- Client-side photo enhancement
- Local storage inventory persistence

If you added API keys on Vercel and search or AI features show errors like "invalid", the keys may be wrong or incomplete. Either fix them or remove them from Vercel to return to demo mode. Check **Settings** in the app to see which integrations are active.

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
│   ├── ebay/
│   ├── openai/
│   ├── photoroom/
│   └── supabase/
└── types/
```

## License

MIT
