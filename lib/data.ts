import type { ElectionData, ConstituencyResult, PartySeats } from "./types";
import { SEED_DATA } from "./seed-data";
import { FEATURED_CONSTITUENCY_SLUG } from "./constants";
import { getPartyColor, PARTY_CONFIG, PARTY_KEYWORD_MAP } from "./constants";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "results.json");
const R2_URL = "https://pub-4173e04d0b78426caa8cfa525f827daa.r2.dev/constituencies.json";
const OK_URL = "https://election.onlinekhabar.com/candidate-list";
const EK_URL = "https://election.ekantipur.com/?lng=eng";
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

let memoryCache: { data: ElectionData; fetchedAt: number } | null = null;

function slugifyParty(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, slug] of PARTY_KEYWORD_MAP) {
    if (lower.includes(keyword.toLowerCase())) return slug;
  }
  return "others";
}

function partyEnglishName(slug: string, original: string): string {
  return PARTY_CONFIG[slug]?.name ?? original;
}

/** Convert Devanagari numerals to Arabic */
function devaToInt(s: string): number {
  const map: Record<string, string> = { "०":"0","१":"1","२":"2","३":"3","४":"4","५":"5","६":"6","७":"7","८":"8","९":"9" };
  const converted = s.replace(/[०-९]/g, (c) => map[c] ?? c);
  const n = parseInt(converted, 10);
  return isNaN(n) ? 0 : n;
}

/** Map OKhar party slug → our internal slug */
const OK_PARTY_SLUG_MAP: Record<string, string> = {
  "rastriya-swatantra-party-rsp": "rastriya-swatantra",
  "nepali-congress": "nc",
  "cpn-uml": "uml",
  "nepali-communist-party": "mc",
  "umlmaoist": "mc",
  "rastriya-prajatantra-party": "rpp",
  "janamat-party": "janamat",
  "nagarik-unmukti-party-nepal": "nagarik",
  "ujyalonepalparty": "ujyalo",
  "shram-sanskriti-party": "others",
  "janata-samajwadi-party-nepal": "others",
};

/** Normalize a slug for matching: strip hyphens + spaces, lowercase */
const normKey = (s: string) => s.replace(/[-\s]/g, "").toLowerCase();

type OKCandidate = {
  nameNepali: string;
  partySlug: string;
  votes: number;
  isLeading: boolean;
};
type OKCard = {
  slugKey: string;  // normalized key e.g. "jhapa5"
  nameNepali: string;
  counting: boolean;
  candidates: OKCandidate[];
};

/**
 * Fetch live vote data from election.onlinekhabar.com/candidate-list.
 * Returns Map<normalizedSlug, OKCard> keyed by stripped constituency slug.
 * Covers ~36 featured/counting constituencies, updates every ~30s.
 */
async function fetchFromOnlineKhabar(): Promise<Map<string, OKCard> | null> {
  try {
    const res = await fetch(OK_URL, {
      next: { revalidate: 30 },
      headers: { "User-Agent": "Nepal2082ElectionSite/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const cardBlocks = html.split('<div class="okel-candidate-card">').slice(1);
    if (cardBlocks.length === 0) return null;

    const result = new Map<string, OKCard>();

    for (const block of cardBlocks) {
      // Extract slug from href: /central-chetra/jhapa5 → "jhapa5"
      const hrefMatch = block.match(/href="https?:\/\/election\.onlinekhabar\.com\/central-chetra\/([a-z0-9]+)"/);
      if (!hrefMatch) continue;
      const rawSlug = hrefMatch[1]; // e.g. "jhapa5", "chitwan3", "rukumeast1"
      const slugKey = normKey(rawSlug);  // already normalized

      // Nepali name
      const nameMatch = block.match(/central-chetra\/[a-z0-9]+"[^>]*>([^<]+)<\/a>/);
      const nameNepali = nameMatch ? nameMatch[1].trim() : "";

      // Status
      const counting = block.includes("is-counting");

      // Parse candidate rows
      const candidates: OKCandidate[] = [];
      const rows = block.split('<div class="okel-candidate-row">').slice(1);

      for (const row of rows) {
        // Party slug from party link href
        const partyHrefMatch = row.match(/\/party\/([a-z0-9-]+)[/"]/);
        const okPartySlug = partyHrefMatch ? partyHrefMatch[1] : "";
        const partySlug = OK_PARTY_SLUG_MAP[okPartySlug] ?? slugifyParty(okPartySlug.replace(/-/g, " "));

        // Candidate Nepali name from <h5><a>...</a></h5>
        const nameNe = (row.match(/<h5[^>]*>[\s\S]*?<a[^>]*>\s*([^<]+?)\s*<\/a>/) ?? [])[1]?.trim() ?? "";

        // Votes: Devanagari in <div class="vote ...">
        const voteMatch = row.match(/<div class="vote[^"]*">([०-९]+)<\/div>/);
        const votes = voteMatch ? devaToInt(voteMatch[1]) : 0;

        // Leading indicator
        const isLeading = row.includes("okel-flag leading") || row.includes("has-won");

        if (nameNe) {
          candidates.push({ nameNepali: nameNe, partySlug, votes, isLeading });
        }
      }

      // Sort by votes descending
      candidates.sort((a, b) => b.votes - a.votes);

      if (candidates.length > 0) {
        result.set(slugKey, { slugKey, nameNepali, counting, candidates });
      }
    }

    return result.size > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Fetch live party standings from OKhar's JSON API.
 * Returns PartySeats[] sorted by total (leading + won) desc.
 */
async function fetchOKPartyStandings(): Promise<PartySeats[] | null> {
  try {
    const res = await fetch(
      "https://election.onlinekhabar.com/wp-json/okelapi/v1/2082/home/election-results?limit=200",
      { next: { revalidate: 30 }, headers: { "User-Agent": "Nepal2082ElectionSite/1.0" } }
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      status: number;
      data: {
        party_results: Array<{
          party_nickname: string;
          party_slug: string;
          party_color: string;
          party_link: string;
          leading_count: number;
          winner_count: number;
          total_seat: number;
        }>;
      };
    };
    if (json.status !== 200 || !json.data?.party_results) return null;

    const raw: PartySeats[] = json.data.party_results
      .filter((p) => p.total_seat > 0)
      .map((p) => {
        const internalSlug = OK_PARTY_SLUG_MAP[p.party_slug] ?? slugifyParty(p.party_nickname);
        return {
          party: partyEnglishName(internalSlug, p.party_nickname),
          partyNepali: p.party_nickname,
          partySlug: internalSlug,
          partyColor: PARTY_CONFIG[internalSlug]?.color ?? p.party_color,
          seats: p.winner_count,
          leading: p.leading_count,
          totalVotes: 0,
          votePercentage: 0,
        };
      });

    // Merge entries that map to the same internal slug (e.g. multiple "others")
    const mergeMap = new Map<string, PartySeats>();
    for (const p of raw) {
      const existing = mergeMap.get(p.partySlug);
      if (existing) {
        existing.seats += p.seats;
        existing.leading += p.leading;
      } else {
        mergeMap.set(p.partySlug, { ...p });
      }
    }

    const standings = [...mergeMap.values()]
      .sort((a, b) => (b.seats + b.leading) - (a.seats + a.leading));

    return standings.length > 0 ? standings : null;
  } catch {
    return null;
  }
}

type EkCandidate = {
  name: string;
  party_name: string;
  vote_count: number;
  is_win: number;
  is_lead: number;
  district_name: string;
  region_num: number;
};

/**
 * Fetch live vote data from election.ekantipur.com.
 * The page embeds `const competiviveDist = {...}` with keyed by "district-N" slugs.
 * Returns a Map<normalizedSlug, candidates[]> — only covers ~17 hot-seat constituencies.
 */
async function fetchFromEkantipur(): Promise<Map<string, EkCandidate[]> | null> {
  try {
    const res = await fetch(EK_URL, {
      next: { revalidate: 30 },
      headers: { "User-Agent": "Nepal2082ElectionSite/1.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const marker = "const competiviveDist = ";
    const markerIdx = html.indexOf(marker);
    if (markerIdx === -1) return null;

    // Find the matching closing brace for the object literal
    const objStart = markerIdx + marker.length;
    let depth = 0;
    let inStr = false;
    let escape = false;
    let objEnd = -1;
    for (let i = objStart; i < Math.min(objStart + 250000, html.length); i++) {
      const c = html[i];
      if (escape) { escape = false; continue; }
      if (c === "\\" && inStr) { escape = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) { objEnd = i + 1; break; } }
      }
    }
    if (objEnd === -1) return null;

    // JS uses \/ for forward slashes — replace with / for valid JSON
    const jsonStr = html.slice(objStart, objEnd).replace(/\\\//g, "/");
    const raw = JSON.parse(jsonStr) as Record<string, EkCandidate[]>;

    const result = new Map<string, EkCandidate[]>();
    for (const [slug, cands] of Object.entries(raw)) {
      // slug is like "jhapa-5", "kathmandu-1", "rukumeast-1"
      result.set(slug, cands);
    }
    return result.size > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Normalize a constituency name to match ekantipur slugs.
 * e.g. "Jhapa - 5" → "jhapa-5", "Rukum East - 1" → "rukumeast-1"
 */
function toEkSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*-\s*/g, "-")   // "Jhapa - 5" → "jhapa-5"
    .replace(/\s+/g, "")        // remove remaining spaces (for "Rukum East" → "rukumeast")
    .replace(/[^a-z0-9-]/g, "");
}

/** Fetch live data directly from nepalvotes.live R2 public bucket */
async function fetchFromR2(): Promise<ElectionData | null> {
  try {
    const res = await fetch(R2_URL, {
      next: { revalidate: 30 },
      headers: { "User-Agent": "Nepal2082ElectionSite/1.0" },
    });
    if (!res.ok) return null;

    const raw = await res.json() as Array<{
      province: string; district: string; districtNp: string;
      code: string; name: string; nameNp: string;
      status: string; lastUpdated: string;
      candidates: Array<{
        candidateId: number; name: string; nameNp: string;
        partyName: string; partyId: string; votes: number; isWinner: boolean;
      }>;
      votesCast: number; totalVoters: number;
    }>;

    if (!Array.isArray(raw) || raw.length === 0) return null;

    const constituencies: ConstituencyResult[] = raw.map((item) => {
      const statusLower = (item.status ?? "").toLowerCase();
      let countingStatus: ConstituencyResult["countingStatus"] = "not-started";
      if (statusLower === "declared" || statusLower === "complete") countingStatus = "complete";
      else if (statusLower === "counting") countingStatus = "counting";

      const candidates = (item.candidates ?? [])
        .map((c, i) => {
          const pslug = slugifyParty(c.partyName);
          return {
            id: `${item.code}-${i}`,
            name: c.name || c.nameNp,
            nameNepali: c.nameNp,
            party: partyEnglishName(pslug, c.partyName),
            partySlug: pslug,
            partyColor: getPartyColor(pslug),
            votes: c.votes ?? 0,
            percentage: 0,
            status: (c.isWinner ? "elected" : "trailing") as import("./types").CandidateStatus,
            isWinner: c.isWinner,
          };
        })
        .sort((a, b) => b.votes - a.votes);

      const total = candidates.reduce((s, c) => s + c.votes, 0);
      candidates.forEach((c, i) => {
        c.percentage = total ? Math.round((c.votes / total) * 1000) / 10 : 0;
        if (!c.isWinner) c.status = (i === 0 ? "leading" : "trailing");
      });

      // Derive status from actual votes — don't trust stale R2 status field
      if (countingStatus !== "complete" && total > 0) countingStatus = "counting";
      else if (countingStatus !== "complete" && total === 0) countingStatus = "not-started";

      const winner = candidates.find((c) => c.isWinner);
      return {
        id: item.code,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: item.name,
        nameNepali: item.nameNp,
        district: item.district,
        province: item.province,
        provinceNumber: 0,
        type: "FPTP" as const,
        candidates,
        totalVotes: total,
        totalVoters: item.totalVoters,
        countingStatus,
        countedPercentage: countingStatus === "complete" ? 100 : total > 0 ? 50 : 0,
        lastUpdated: item.lastUpdated ?? new Date().toISOString(),
        ...(winner ? { winner } : {}),
      };
    });

    // Build party standings from results
    const seatMap = new Map<string, { party: string; partySlug: string; partyColor: string; seats: number; leading: number; votes: number }>();
    for (const c of constituencies) {
      if (c.countingStatus === "complete" && c.winner) {
        const s = c.winner.partySlug;
        const e = seatMap.get(s) ?? { party: c.winner.party, partySlug: s, partyColor: c.winner.partyColor, seats: 0, leading: 0, votes: 0 };
        e.seats++;
        e.votes += c.totalVotes;
        seatMap.set(s, e);
      } else if (c.countingStatus === "counting" && c.candidates[0]) {
        const s = c.candidates[0].partySlug;
        const e = seatMap.get(s) ?? { party: c.candidates[0].party, partySlug: s, partyColor: c.candidates[0].partyColor, seats: 0, leading: 0, votes: 0 };
        e.leading++;
        e.votes += c.totalVotes;
        seatMap.set(s, e);
      }
    }

    const totalVotesCounted = constituencies.reduce((s, c) => s + c.totalVotes, 0);
    const partySeats: PartySeats[] = [...seatMap.values()]
      .map((p) => ({
        party: p.party,
        partySlug: p.partySlug,
        partyColor: p.partyColor,
        seats: p.seats,
        leading: p.leading,
        totalVotes: p.votes,
        votePercentage: totalVotesCounted > 0 ? Math.round((p.votes / totalVotesCounted) * 1000) / 10 : 0,
      }))
      .sort((a, b) => (b.seats + b.leading) - (a.seats + a.leading));

    const declared = constituencies.filter((c) => c.countingStatus === "complete").length;
    const counting = constituencies.filter((c) => c.countingStatus === "counting").length;

    return {
      constituencies,
      national: {
        totalConstituencies: 165,
        resultsDeclared: declared,
        counting,
        notStarted: 165 - declared - counting,
        partySeats,
        totalVotesCounted,
        lastUpdated: new Date().toISOString(),
      },
      scrapedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("[data] R2 fetch failed:", e);
    return null;
  }
}

/** Read from the scraped JSON file (populated by Python or Node scraper) */
async function readFromFile(): Promise<ElectionData | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as ElectionData;
  } catch {
    return null;
  }
}

/** Get election data — R2 live first, then local file, then seed */
export async function getElectionData(): Promise<ElectionData> {
  // Memory cache (in-process, short TTL)
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  // Primary: R2 live data
  const r2Data = await fetchFromR2();
  if (r2Data) {
    // Fetch fresh overlays concurrently (OKhar HTML, Ekantipur, OKhar party API)
    const [okPatch, ekPatch, okPartyStandings] = await Promise.all([
      fetchFromOnlineKhabar(),
      fetchFromEkantipur(),
      fetchOKPartyStandings(),
    ]);

    for (const c of r2Data.constituencies) {
      const ekSlug = toEkSlug(c.name);
      const slugKey = normKey(c.slug);  // "jhapa5", "chitwan3", etc.

      // ekantipur patch candidates (keyed by district slug)
      const ekCands = ekPatch?.get(ekSlug) ?? null;
      // OKhar card (keyed by normalized slug — slug-based, reliable)
      const okCard = okPatch?.get(slugKey) ?? null;

      // Determine best source: use whichever has highest total votes (= most recently counted)
      const ekTotal = ekCands ? ekCands.reduce((s, cand) => s + cand.vote_count, 0) : 0;
      const okTotal = okCard ? okCard.candidates.reduce((s, cand) => s + cand.votes, 0) : 0;
      const r2Total = c.totalVotes;

      if (ekTotal > 0 && ekTotal >= okTotal && ekTotal >= r2Total) {
        // Use ekantipur data — match candidates by English name
        const total = ekTotal;
        const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

        c.candidates = c.candidates.map((cand) => {
          const candNorm = normName(cand.name);
          const ekCand =
            ekCands!.find((ec) => normName(ec.name) === candNorm) ??
            ekCands!.find((ec) => {
              const en = normName(ec.name);
              return en.startsWith(candNorm.slice(0, 5)) || candNorm.startsWith(en.slice(0, 5));
            });
          if (!ekCand) return cand;
          const rank = [...ekCands!].sort((a, b) => b.vote_count - a.vote_count).indexOf(ekCand);
          return {
            ...cand,
            votes: ekCand.vote_count,
            percentage: total ? Math.round((ekCand.vote_count / total) * 1000) / 10 : 0,
            isWinner: ekCand.is_win === 1,
            status: ekCand.is_win === 1 ? "elected" : (rank === 0 ? "leading" : "trailing"),
          } as typeof cand;
        });
        c.candidates.sort((a, b) => b.votes - a.votes);
        c.totalVotes = total;
        if (c.countingStatus !== "complete" && total > 0) c.countingStatus = "counting";
        c.lastUpdated = new Date().toISOString();

      } else if (okCard && okTotal > 0) {
        // Use OKhar data — matched by slug; align candidates by position (both sorted desc)
        const sortedCands = [...c.candidates].sort((a, b) => b.votes - a.votes);
        const okSorted = okCard!.candidates; // already sorted desc
        let totalPatched = 0;
        sortedCands.forEach((cand, i) => {
          if (i < okSorted.length) {
            cand.votes = okSorted[i].votes;
            totalPatched += okSorted[i].votes;
          }
        });
        if (totalPatched > 0) {
          c.candidates = sortedCands;
          c.totalVotes = totalPatched;
          c.candidates.forEach((cand) => {
            cand.percentage = Math.round((cand.votes / totalPatched) * 1000) / 10;
          });
          c.countingStatus = "counting";
          c.lastUpdated = new Date().toISOString();
        }
      }
      // else: keep R2 data as-is
    }

    // Re-derive status from actual votes — don't trust stale R2 status fields
    for (const c of r2Data.constituencies) {
      if (c.countingStatus !== "complete") {
        c.countingStatus = c.totalVotes > 0 ? "counting" : "not-started";
      }
    }

    // Recount status from patched data
    const declared = r2Data.constituencies.filter((c) => c.countingStatus === "complete").length;
    const counting = r2Data.constituencies.filter((c) => c.countingStatus === "counting").length;
    r2Data.national.resultsDeclared = declared;
    r2Data.national.counting = counting;
    r2Data.national.notStarted = 165 - declared - counting;

    if (okPartyStandings && okPartyStandings.length > 0) {
      // Use OKhar live API party standings (most accurate seat count)
      r2Data.national.partySeats = okPartyStandings;
      // Sync resultsDeclared with OKhar's winner counts (authoritative).
      // Clamp to 165 FPTP seats — OKhar sometimes includes PR seats in its counts.
      const okDeclared = Math.min(
        okPartyStandings.reduce((s, p) => s + p.seats, 0),
        165,
      );
      if (okDeclared > declared) {
        r2Data.national.resultsDeclared = okDeclared;
        r2Data.national.notStarted = Math.max(0, 165 - okDeclared - counting);
      }
    } else {
      // Fallback: rebuild from patched constituency data
      const seatMap = new Map<string, { party: string; partySlug: string; partyColor: string; seats: number; leading: number; votes: number }>();
      for (const c of r2Data.constituencies) {
        if (c.countingStatus === "complete" && c.winner) {
          const s = c.winner.partySlug;
          const e = seatMap.get(s) ?? { party: c.winner.party, partySlug: s, partyColor: c.winner.partyColor, seats: 0, leading: 0, votes: 0 };
          e.seats++; e.votes += c.totalVotes; seatMap.set(s, e);
        } else if (c.countingStatus === "counting" && c.candidates[0]) {
          const s = c.candidates[0].partySlug;
          const e = seatMap.get(s) ?? { party: c.candidates[0].party, partySlug: s, partyColor: c.candidates[0].partyColor, seats: 0, leading: 0, votes: 0 };
          e.leading++; e.votes += c.totalVotes; seatMap.set(s, e);
        }
      }
      const totalVotesCounted = r2Data.constituencies.reduce((s, c) => s + c.totalVotes, 0);
      r2Data.national.partySeats = [...seatMap.values()]
        .map((p) => ({ party: p.party, partySlug: p.partySlug, partyColor: p.partyColor, seats: p.seats, leading: p.leading, totalVotes: p.votes, votePercentage: totalVotesCounted > 0 ? Math.round((p.votes / totalVotesCounted) * 1000) / 10 : 0 }))
        .sort((a, b) => (b.seats + b.leading) - (a.seats + a.leading));
      r2Data.national.totalVotesCounted = totalVotesCounted;
    }

    memoryCache = { data: r2Data, fetchedAt: Date.now() };
    return r2Data;
  }

  // Fallback: local scraped file
  const fileData = await readFromFile();
  const data = fileData ?? SEED_DATA;
  memoryCache = { data, fetchedAt: Date.now() };
  return data;
}

/** Get a single constituency by slug */
export async function getConstituency(
  slug: string
): Promise<ConstituencyResult | null> {
  const data = await getElectionData();
  return data.constituencies.find((c) => c.slug === slug) ?? null;
}

/** Get the featured / hero constituency */
export async function getFeaturedConstituency(): Promise<ConstituencyResult | null> {
  return getConstituency(FEATURED_CONSTITUENCY_SLUG);
}

/** Get all constituencies, optionally filtered by province or district */
export async function getConstituencies(filters?: {
  province?: string;
  district?: string;
  status?: string;
}): Promise<ConstituencyResult[]> {
  const data = await getElectionData();
  let results = data.constituencies;

  if (filters?.province) {
    results = results.filter((c) =>
      c.province.toLowerCase().includes(filters.province!.toLowerCase())
    );
  }
  if (filters?.district) {
    results = results.filter((c) =>
      c.district.toLowerCase().includes(filters.district!.toLowerCase())
    );
  }
  if (filters?.status) {
    results = results.filter((c) => c.countingStatus === filters.status);
  }

  return results;
}

/** Serialize data to the JSON file (called by scraper API route) */
export async function saveElectionData(data: ElectionData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  // Bust memory cache
  memoryCache = null;
}
