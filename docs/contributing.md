# Contributing

Thanks for your interest in contributing to the Nepal 2082 Election Results Tracker.

---

## Local Setup

**Prerequisites:** Node.js 20+, pnpm

```bash
# 1. Clone the repo (or fork it first on GitHub)
git clone https://github.com/RusilKoirala/openvote.git
cd openvote

# 2. Install dependencies
pnpm install

# 3. Create your local env file
cp .env.example .env.local
```

Fill in `.env.local`:

```env
SCRAPE_SECRET=any-local-secret
R2_BUCKET_URL=https://your-r2-bucket-url
```

```bash
# 4. Start the dev server
pnpm dev
```

The app will be at [http://localhost:3000](http://localhost:3000).

---

## Working with Data Locally

The app falls back to `lib/seed-data.ts` when `data/results.json` is missing, so you can develop without live data.

To populate live data locally:

```bash
curl "http://localhost:3000/api/scrape?token=any-local-secret&source=r2"
```

This writes `data/results.json` and you'll see live results on refresh.

---

## Project Conventions

### TypeScript
- All props and return types should be explicitly typed using interfaces from `lib/types.ts`.
- Avoid `any` — use `unknown` with narrowing if needed.

### Components
- Server Components by default — only add `"use client"` when you need browser APIs, state, or event handlers.
- Put reusable shadcn-based UI primitives in `components/ui/`. Put page-level components directly in `components/`.

### Styling
- Use Tailwind utility classes. Avoid inline `style` except for dynamic values (party colors, percentage widths).
- Responsive design: mobile-first — base classes for mobile, `sm:` / `md:` for larger screens.

### Party Colors & Slugs
- All party configuration lives in `lib/constants.ts` (`PARTY_CONFIG` and `PARTY_KEYWORD_MAP`).
- To add support for a new party: add an entry to `PARTY_CONFIG` and add matching keywords to `PARTY_KEYWORD_MAP`.

---

## Adding a New Page

1. Create `app/your-page/page.tsx` as a Server Component.
2. Add a link in `components/NavLinks.tsx`.
3. Add it to the mobile drawer in `components/SiteNav.tsx`.

---

## Adding a New Data Source

1. Add a fetch function in `lib/scraper.ts`.
2. Call it inside `scrapeFromR2()` (or create a new pipeline function) in `lib/data.ts`.
3. Merge its results using the existing constituency-merge pattern (match by `slug`, prefer newer `lastUpdated`).

---

## Pull Request Checklist

- [ ] `pnpm build` passes with no errors
- [ ] `pnpm lint` passes
- [ ] New components follow the Server/Client split convention
- [ ] No hardcoded secrets or credentials
- [ ] Data clamping rules respected (no > 165 seats, no negative counts)

---

## Reporting Issues

Open a GitHub Issue with:
- What you expected to see
- What you actually saw
- Steps to reproduce (if it's a UI/data bug)
- Screenshot if relevant
