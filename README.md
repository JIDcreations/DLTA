# DLTA (Delta)

DLTA is a portfolio-grade crypto tracker that logs multiple purchase lots per coin, computes live profit/loss, and stores everything locally with IndexedDB + LocalStorage fallback. It runs fully client-side and is deployable to Vercel or Netlify without paid services.

## Features
- Track BTC, ETH, XRP purchases (multiple lots per coin)
- Weighted average buy, break-even, and per-lot P/L
- Live prices with caching + offline fallback
- Premium charts (allocation donut + price history with buy markers)
- Import/Export JSON + reset
- Fully responsive, dark premium UI
- Optional cloud sync via Supabase magic link (free-tier)

## Tech Stack
- Next.js (App Router) + TypeScript
- Zustand state
- IndexedDB (with LocalStorage fallback)
- Recharts + Framer Motion
- Plain CSS + CSS Modules

## Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

## Production Build
```bash
npm run build
npm run start
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. In Vercel, choose **New Project** and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build`
5. Output: auto-detected.
6. Deploy.

## Deploy to Netlify
1. Push this repo to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Netlify will use the `@netlify/plugin-nextjs` defined in `netlify.toml`.

## Free Price API (CoinGecko)
DLTA uses public CoinGecko endpoints (no API key required):
- Current prices + 24h change:
  - `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=eur&include_24hr_change=true`
- Historical chart data (7d/30d):
  - `https://api.coingecko.com/api/v3/coins/{id}/market_chart?vs_currency=eur&days=7`
  - `https://api.coingecko.com/api/v3/coins/{id}/market_chart?vs_currency=eur&days=30`

## Optional Cloud Sync (Supabase Magic Link)
DLTA works offline by default. To sync across devices, use Supabase (free tier).

### 1) Create the table
In Supabase SQL editor:
```sql
create table if not exists public.dlta_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dlta_portfolios enable row level security;

create policy "Users can read their own data"
on public.dlta_portfolios
for select
using (auth.uid() = user_id);

create policy "Users can insert their own data"
on public.dlta_portfolios
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own data"
on public.dlta_portfolios
for update
using (auth.uid() = user_id);
```

### 2) Configure auth
- In Supabase Auth settings, enable **Email**.
- Add your site URL to **Redirect URLs** (e.g. `https://your-site.netlify.app/settings`).

### 3) Add environment variables
Create `.env.local` or set Netlify/Vercel env vars:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4) Use the sync UI
In **Settings → Cloud sync**, enter your email and request a magic link.
After signing in, use **Pull from cloud** or **Push to cloud**.

## Data Model
```ts
CoinSymbol = "BTC" | "ETH" | "XRP"
PurchaseLot = {
  id: string
  symbol: CoinSymbol
  datetimeISO: string
  eurSpent: number
  buyPrice: number
  quantity: number
  note?: string
}
Preferences = {
  refreshIntervalSeconds: number
  showAdvanced: boolean
  showNotes: boolean
}
PortfolioState = {
  lots: PurchaseLot[]
  preferences: Preferences
  cachedPrices: Record<CoinSymbol, { eur: number; change24h?: number; updatedAtISO: string }>
  schemaVersion: number
}
```

## Notes
- Stored data works offline (prices show last known values if the API fails).
- Add more coins by extending `src/lib/coins.ts`.
