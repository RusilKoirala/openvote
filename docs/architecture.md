# Architecture

## Overview

The app is a **Next.js 16 App Router** project deployed on Vercel. It is a read-heavy, server-rendered site with a lightweight API layer for scraping and serving election results.

```
Browser
  │
  ├─ GET /                      → app/page.tsx          (homepage — results overview)
  ├─ GET /constituency/[slug]   → app/constituency/...  (single constituency page)
  ├─ GET /about                 → app/about/page.tsx
  ├─ GET /faq                   → app/faq/page.tsx
  ├─ GET /sources                → app/sources/page.tsx
  │
  ├─ GET /api/results           → app/api/results/route.ts      (national stats + all constituencies)
  ├─ GET /api/results/[id]      → app/api/results/[id]/route.ts (single constituency)
  └─ GET /api/scrape?token=...  → app/api/scrape/route.ts       (scrape trigger)
```

---

## Directory Map

```
2082election/
├── app/                        Next.js App Router
│   ├── layout.tsx              Root layout (font, theme, SiteNav)
│   ├── page.tsx                Homepage — national overview + party standings + hot seats
│   ├── globals.css             Global Tailwind + utility classes
│   ├── about/page.tsx          About page
│   ├── faq/page.tsx            FAQ page
│   ├── sources/page.tsx        Data sources page
│   ├── constituency/
│   │   └── [slug]/page.tsx     Individual constituency result
│   └── api/
│       ├── results/
│       │   ├── route.ts        GET /api/results
│       │   └── [id]/route.ts   GET /api/results/:id
│       └── scrape/route.ts     GET /api/scrape
│
├── components/                 React UI components
│   ├── SiteNav.tsx             Top navigation bar (desktop + mobile drawer)
│   ├── NationalOverview.tsx    Reporting % headline + status tiles + progress bar
│   ├── PartySeatsChart.tsx     SVG parliament hemicycle (165 dots)
│   ├── HotSeats.tsx            Tight-race VS battle cards
│   ├── ProvinceBreakdown.tsx   7-province seat summary
│   ├── ConstituencyList.tsx    Searchable/filterable constituency grid
│   ├── ConstituencyCard.tsx    Single constituency card with leading party bar
│   ├── HeroConstituency.tsx    Featured constituency large card
│   ├── LiveTicker.tsx          Scrolling live updates ticker
│   ├── LiveBadge.tsx           "LIVE" animated dot badge
│   ├── NavLinks.tsx            Shared nav link list
│   ├── RefreshButton.tsx       Manual data refresh button
│   ├── StatusBadge.tsx         Counting status pill (Declared/Counting/Not started)
│   ├── VoteBar.tsx             Candidate vote percentage bars
│   └── ui/                     shadcn/ui primitives (Button, Card, Badge, etc.)
│
├── lib/
│   ├── types.ts                Shared TypeScript interfaces
│   ├── constants.ts            Party config (color, name, slug, keyword map)
│   ├── scraper.ts              Scraping logic (ECS + R2)
│   ├── data.ts                 Data access layer (read/write/merge results.json)
│   ├── seed-data.ts            Static seed for local dev / fallback
│   └── utils.ts                cn() helper + small utilities
│
├── data/
│   └── results.json            Live scraped results (gitignored)
│
├── public/
│   ├── parties/                Party logo images
│   └── favicon_io/             Favicon set
│
└── docs/                       This documentation folder
```

---

## Component Hierarchy (Homepage)

```
app/page.tsx
├── SiteNav
├── LiveBadge + RefreshButton
├── NationalOverview          ← declared / counting / not-started + progress bar
├── PartySeatsChart           ← SVG hemicycle with 165 seat dots
├── HotSeats                  ← top tight races (<15% margin)
├── ProvinceBreakdown         ← 7 province cards
└── ConstituencyList          ← search + province filter + constituency grid
    └── ConstituencyCard *165
```

---

## Key Design Decisions

### Server Components by default
All pages are Next.js Server Components — they call `getElectionData()` on the server and pass props down. Only interactive leaves (search bar, refresh button, mobile nav) are `"use client"`.

### Single JSON store
Results are stored and served from a single `data/results.json` file (or R2-equivalent). This keeps the read path simple: one file read per request, no database.

### Multi-source merge
Data is fetched from three sources and merged in priority order:
1. **R2 bucket** (`results.json`) — primary, updated every 5 min by cron
2. **OnlineKhabar** HTML scrape — overlay for ~36 real-time seats
3. **OKhar party standings API** — authoritative seat totals per party

### 165 FPTP seats only
The app deliberately tracks only the 165 First-Past-The-Post (FPTP) constituencies. Proportional Representation (PR) seats come later via a separate process and are excluded to avoid inflated counts.
