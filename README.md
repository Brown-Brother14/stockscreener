# AlgoScreen Pro

A real-time stock screener and portfolio analyser with AI-powered insights.

**Live site:** https://brown-brother14.github.io/stockscreener/

## Features

- **Stock Screener** — scan 500+ tickers with technical/fundamental filters, real-time Finnhub WebSocket prices
- **Portfolio Analyser** — track holdings, live P&L, sector breakdown vs SPY, AI portfolio grading
- **Market Dashboard** — Fear & Greed index, SPY/QQQ/DIA quotes, curated market news
- **AI Insights** — Claude-powered analysis routed through a Cloudflare Worker proxy
- **Auth** — email/password and Google OAuth via Supabase

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, HTML5, CSS3 (no framework) |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| Real-time | Finnhub WebSocket |
| Market data | Yahoo Finance, Twelve Data (via Worker) |
| AI | Claude API (via Cloudflare Worker proxy) |
| Hosting | GitHub Pages |
| Proxy | Cloudflare Workers |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL below in the Supabase SQL editor
3. Update `SUPABASE_URL` and `SUPABASE_ANON` in `supabase-client.js`

```sql
create table watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  symbol text not null,
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

create table portfolio (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  symbol text not null,
  shares numeric not null,
  avg_cost numeric not null,
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

create table screener_presets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  filters jsonb not null,
  created_at timestamptz default now()
);

create table user_prefs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  dashboard_layout jsonb,
  updated_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table watchlist enable row level security;
alter table portfolio enable row level security;
alter table screener_presets enable row level security;
alter table user_prefs enable row level security;

-- RLS policies (users can only access their own data)
create policy "own rows" on watchlist for all using (auth.uid() = user_id);
create policy "own rows" on portfolio for all using (auth.uid() = user_id);
create policy "own rows" on screener_presets for all using (auth.uid() = user_id);
create policy "own rows" on user_prefs for all using (auth.uid() = user_id);
```

4. In Supabase → Authentication → URL Configuration, set:
   - Site URL: `https://brown-brother14.github.io/stockscreener/`
   - Redirect URL: `https://brown-brother14.github.io/stockscreener/auth.html`

### 2. Cloudflare Worker

The app requires a Cloudflare Worker to:
- Proxy Yahoo Finance and Twelve Data API calls (CORS bypass)
- Proxy RSS feeds
- Proxy Claude API calls (**adds your API key server-side**)
- Cache scan results

Deploy to [workers.cloudflare.com](https://workers.cloudflare.com) (free tier).

The worker must handle these routes:

| Route | Description |
|---|---|
| `GET /yf/quote?symbols=...` | Yahoo Finance batch quote |
| `GET /yf/chart/:ticker` | Yahoo Finance OHLCV |
| `GET /finnhub/:endpoint` | Finnhub REST proxy |
| `GET /twelvedata/:endpoint` | Twelve Data proxy |
| `GET /rss?url=...` | RSS feed proxy |
| `POST /ai/analyse` | Claude portfolio analysis (adds `x-api-key` header) |
| `POST /ai/insight` | Claude indicator insight (adds `x-api-key` header) |
| `GET/POST /scandata` | Scan result cache (KV store) |

After deploying, update the `PROXY` constant in `screener.html` and `WORKER` in `portfolio.html`.

### 3. Finnhub API Key

1. Sign up at [finnhub.io](https://finnhub.io) (free)
2. Copy your API key
3. Update `FINNHUB_WS_KEY` in `screener.html`

> **Security note:** The Finnhub key is visible in client-side source. Rotate it periodically from the Finnhub dashboard. For production, proxy the WebSocket connection through your Cloudflare Worker.

### 4. Local Development

No build step required — open any `.html` file directly in a browser, or use a local server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

### 5. Deployment (GitHub Pages)

Push to `main` — GitHub Pages auto-deploys from the repo root.

## Project Structure

```
/
├── index.html          # Landing page + market dashboard
├── screener.html       # Stock screener (5,400 lines — main app)
├── portfolio.html      # Portfolio tracker + AI analysis
├── auth.html           # Sign in / sign up
├── settings.html       # Account settings
├── about.html          # About page
├── supabase-client.js  # Shared Supabase auth + data helpers
└── .github/
    └── workflows/
        └── ci.yml      # CI: HTML lint + ESLint
```

## Security Notes

- Supabase anon key is intentionally public (protected by RLS policies)
- Claude API key must **only** live in the Cloudflare Worker — never in client code
- Finnhub key is visible client-side; rotate regularly
- All RSS feed content is HTML-escaped before rendering
- User ticker inputs are sanitized to `[A-Z0-9.^]` before use

## License

MIT
