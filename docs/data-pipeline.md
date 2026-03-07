# Data Pipeline

## Overview

Election results flow through three sources that are merged in priority order before being stored and served.

```
┌─────────────────────┐
│  Cloudflare R2      │  Primary — results.json updated every 5 min
│  (nepalvotes.live)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  OnlineKhabar scrape│  Overlay — ~36 real-time constituency results
│  (HTML page)        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  OKhar party API    │  Overlay — authoritative seat totals per party
│  (JSON endpoint)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  data/results.json  │  Written by scraper, read by /api/results
└─────────────────────┘
```

---

## Data Sources

### 1. R2 Bucket (Primary)

A Cloudflare R2 public bucket at `R2_BUCKET_URL` hosts a `results.json` file in the `ElectionData` schema. It is updated externally (by a separate scraper process) every ~5 minutes using data from the Nepal Election Commission's site (`result.election.gov.np`).

This is the backbone — it contains all 165 FPTP constituency results with candidate-level vote counts.

**Access:** `GET ${R2_BUCKET_URL}/results.json`

### 2. OnlineKhabar HTML Scrape (Overlay)

OnlineKhabar publishes a live results page. The scraper fetches the HTML, parses it with Cheerio, and extracts constituency-level results for seats where it has more recent data. These results are merged on top of the R2 baseline — the scrape wins if it has a newer `lastUpdated`.

**Note:** This source is optional. If the request fails, the pipeline continues with R2 data only.

### 3. OKhar Party Standings API (Overlay)

OKhar (an established Nepali news site) publishes a JSON API with authoritative per-party seat totals. This is used to update `NationalStats.partySeats` — specifically the `seats` (won) and `leading` counts per party.

**Important caveat:** OKhar's `winner_count` field includes PR seats. The pipeline clamps the total declared seats to a maximum of 165 to prevent inflated numbers.

---

## Scrape Trigger

The `/api/scrape` endpoint triggers a full pipeline run:

```
GET /api/scrape?token=<SCRAPE_SECRET>[&source=r2|ecs]
```

- `source=r2` (default) — fetch from R2 bucket + apply overlays
- `source=ecs` — fetch directly from Election Commission (requires Nepal IP)

This endpoint is protected by the `SCRAPE_SECRET` environment variable. Requests without a matching token receive `401 Unauthorized`.

### Cron Setup (Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/scrape?token=YOUR_SECRET&source=r2",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Data Schema

### `ElectionData` (root object in `results.json`)

```ts
interface ElectionData {
  constituencies: ConstituencyResult[];  // 165 FPTP seats
  national: NationalStats;
  scrapedAt: string;                     // ISO 8601 timestamp
}
```

### `ConstituencyResult`

```ts
interface ConstituencyResult {
  id: string;
  slug: string;               // e.g. "jhapa-5"
  name: string;               // e.g. "Jhapa-5"
  nameNepali?: string;
  district: string;
  province: string;
  provinceNumber: number;     // 1–7
  type: "FPTP" | "PR";
  candidates: CandidateResult[];
  totalVotes: number;
  countingStatus: "not-started" | "counting" | "complete";
  countedPercentage: number;  // 0–100
  lastUpdated: string;        // ISO 8601
  winner?: CandidateResult;
}
```

### `NationalStats`

```ts
interface NationalStats {
  totalConstituencies: number;   // always 165
  resultsDeclared: number;       // counting status = "complete"
  counting: number;              // counting status = "counting"
  notStarted: number;            // counting status = "not-started"
  partySeats: PartySeats[];
  totalVotesCounted: number;
  lastUpdated: string;
}
```

### `PartySeats`

```ts
interface PartySeats {
  party: string;             // English name
  partyNepali?: string;      // Nepali name
  partySlug: string;         // e.g. "nc", "uml", "rpp"
  partyColor: string;        // hex color for charts
  seats: number;             // confirmed wins
  leading: number;           // currently leading (not final)
  totalVotes: number;
  votePercentage: number;
}
```

---

## Party Slug Map

Parties are normalised to slugs by keyword-matching their Nepali/English name:

| Slug | Party |
|---|---|
| `nc` | Nepali Congress |
| `uml` | CPN (Unified Marxist-Leninist) |
| `mc` | CPN (Maoist Centre) |
| `rpp` | Rastriya Prajatantra Party |
| `rastriya-swatantra` | Rastriya Swatantra Party |
| `janamat` | Janamat Party |
| `others` | All other / unrecognised parties |

---

## Clamping Rules

To guard against OKhar's inflated counts (PR seats included):

```ts
const okDeclared = Math.min(okTotal, 165);
const notStarted = Math.max(0, 165 - okDeclared - counting);
```

The `reportingPct` shown in `NationalOverview` is also capped at 100%:

```ts
const reportingPct = Math.min(100, Math.round(((declared + counting) / 165) * 100));
```
