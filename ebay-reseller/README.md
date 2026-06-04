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
| `EBAY_REDIRECT_URI` | OAuth redirect URI (e.g. `https://yourapp.com/api/ebay/callback`) |
| `EBAY_ENV` | `sandbox` or `production` |
| `PHOTOROOM_API_KEY` | PhotoRoom API key for background removal |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

## Demo Mode

Without API keys configured, the app runs in demo mode with:
- Mock AI product analysis
- Simulated market research data
- Client-side photo enhancement
- Local storage inventory persistence

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/ebay-reseller)

Add all environment variables in the Vercel dashboard.

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
