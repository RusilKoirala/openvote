# OpenVote — Election Results Tracker

> A free, open-source template for building real-time election results trackers.
> Built for Nepal's **2082 B.S. (2025/26)** parliamentary elections — but designed so
> **anyone can fork it and adapt it for their own country or election.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://election.rusil.me)

**Live demo:** [election.rusil.me](https://election.rusil.me) · **GitHub:** [RusilKoirala/openvote](https://github.com/RusilKoirala/openvote)

---

## Fork it for your own election

This project is intentionally generic under the hood. To adapt it for a different election:

1. **Data sources** → replace `lib/scraper.ts` with your country's election commission API or HTML page
2. **Parties** → update names, colors, and slugs in `lib/constants.ts`
3. **Terminology** → rename constituency/district/province fields in `lib/types.ts` to match your system
4. **Seat counts** → update total seats and majority threshold in `components/PartySeatsChart.tsx`

The UI, data pipeline, scrape-trigger API, and Vercel deployment config all carry over with minimal changes.

---

## Features

- **Live results** — auto-refreshes every 5 minutes from multiple data sources
- **Parliament hemicycle** — 165-seat SVG visualization of party standings
- **Hot seats** — tight races updated in real time
- **Province breakdown** — seat counts and status per province
- **Constituency pages** — candidate-level vote counts and margins
- **Mobile-first UI** — responsive design with hamburger nav and scrollable tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Language | TypeScript |
| Data fetching | Axios + Cheerio (server-side scraping) |
| Deployment | Vercel |

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | Project structure, component map, data flow |
| [Data Pipeline](docs/data-pipeline.md) | How results are scraped, merged, and served |
| [API Reference](docs/api-reference.md) | REST API endpoints and response shapes |
| [Contributing](docs/contributing.md) | Local setup, conventions, and PR guide |

---

## Quick Start

**Prerequisites:** Node.js 20+, pnpm

```bash
# 1. Clone the repo
git clone https://github.com/RusilKoirala/openvote.git
cd openvote

# 2. Install dependencies
pnpm install

# 3. Set environment variables
cp .env.example .env.local
# Edit .env.local — fill in SCRAPE_SECRET and R2_BUCKET_URL
# See docs/data-pipeline.md for what each variable does

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the app loads with seed data if `data/results.json` is missing.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SCRAPE_SECRET` | Yes | Bearer token that protects `GET /api/scrape` |
| `R2_BUCKET_URL` | Yes | Public URL of the Cloudflare R2 bucket holding `results.json` |

---

## Project Structure

```
app/                  Next.js App Router pages and API routes
  api/results/        JSON API — national stats + constituency list
  api/scrape/         Scrape trigger endpoint (cron-safe)
  constituency/[slug] Individual constituency result page
components/           React UI components
  ui/                 shadcn/ui primitives
lib/
  types.ts            Shared TypeScript interfaces
  constants.ts        Party colours, slugs, keyword map
  scraper.ts          Election Commission + R2 scraper logic
  data.ts             Data access layer (read/write results.json)
  seed-data.ts        Static seed for local development
data/
  results.json        Scraped results (gitignored in production)
docs/                 Project documentation
```

---

## License

MIT © 2026

---

> *"Government of the people, by the people, for the people, shall not perish from the earth."*
> — Abraham Lincoln, Gettysburg Address, 1863
