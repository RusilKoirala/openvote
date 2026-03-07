# API Reference

All endpoints are under `/api/`. They return JSON.

---

## `GET /api/results`

Returns national statistics and the full list of constituency results.

### Response

```json
{
  "national": {
    "totalConstituencies": 165,
    "resultsDeclared": 142,
    "counting": 18,
    "notStarted": 5,
    "partySeats": [
      {
        "party": "Nepali Congress",
        "partyNepali": "नेपाली काँग्रेस",
        "partySlug": "nc",
        "partyColor": "#1565C0",
        "seats": 68,
        "leading": 4,
        "totalVotes": 2300000,
        "votePercentage": 27.4
      }
    ],
    "totalVotesCounted": 8400000,
    "lastUpdated": "2026-03-07T10:32:00.000Z"
  },
  "constituencies": [
    {
      "id": "jhapa-5",
      "slug": "jhapa-5",
      "name": "Jhapa-5",
      "nameNepali": "झापा-५",
      "district": "Jhapa",
      "province": "Province No. 1",
      "provinceNumber": 1,
      "type": "FPTP",
      "candidates": [...],
      "totalVotes": 48200,
      "countingStatus": "complete",
      "countedPercentage": 100,
      "lastUpdated": "2026-03-07T09:15:00.000Z",
      "winner": { ... }
    }
  ],
  "scrapedAt": "2026-03-07T10:32:00.000Z"
}
```

### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| _(none)_ | — | Returns full dataset |

---

## `GET /api/results/:id`

Returns a single constituency result by its slug or ID.

### Example

```
GET /api/results/jhapa-5
```

### Response

Same shape as a single item from `constituencies[]` above.

### Error Response

```json
{ "error": "Not found" }
```
HTTP `404` if the slug doesn't match any constituency.

---

## `GET /api/scrape`

Triggers a data pipeline run — fetches fresh data from R2 (or ECS) and writes it to `data/results.json`.

**Protected endpoint.** Requires `SCRAPE_SECRET` token.

### Query Parameters

| Parameter | Required | Values | Description |
|---|---|---|---|
| `token` | Yes | string | Must match `SCRAPE_SECRET` env var |
| `source` | No | `r2` (default) \| `ecs` | `r2` = Cloudflare R2 bucket; `ecs` = Nepal Election Commission direct |

### Example

```
GET /api/scrape?token=my-secret&source=r2
```

### Success Response

```json
{
  "ok": true,
  "source": "r2",
  "constituencies": 165,
  "counting": 18,
  "scrapedAt": "2026-03-07T10:32:00.000Z"
}
```

### Error Responses

| Status | Body | Reason |
|---|---|---|
| `401` | `{ "error": "Unauthorized" }` | Missing or wrong `token` |
| `503` | `{ "error": "No data returned from source", "source": "r2" }` | Scraper returned null — upstream may be down |
| `500` | `{ "error": "Scrape failed" }` | Uncaught exception during scrape |

---

## Notes

- All timestamps are **ISO 8601 UTC** strings.
- `countedPercentage` is `0–100` and represents how much of ballot counting is complete for that constituency — not the overall election reporting percentage.
- `seats` = confirmed elected; `leading` = currently ahead but not yet declared.
- `partySlug` values: `nc`, `uml`, `mc`, `rpp`, `rastriya-swatantra`, `janamat`, `others`.
