/**
 * Node.js scraper for Nepal Election Commission results
 * Target: https://result.election.gov.np/
 *
 * Auth: GET / → harvest ASP.NET_SessionId + CsrfToken cookies
 *       then send CsrfToken as X-CSRF-Token on every data request
 *
 * Endpoints (all via /Handlers/SecureJson.ashx?file=JSONFiles/Election2082/Common/FILE):
 *   HoRPartyTop5.txt     — National party standings  [CONFIRMED LIVE]
 *   FPTPConstituency.txt — All 165 FPTP constituency results
 *   FPTPCandidate.txt    — Candidate-level vote counts
 *
 * This runs inside Next.js API routes (/api/scrape) and on Vercel cron.
 */

import axios, { AxiosInstance } from "axios";
import type {
  ElectionData,
  ConstituencyResult,
  CandidateResult,
  NationalStats,
  PartySeats,
} from "./types";
import { getPartyColor, PARTY_CONFIG, PARTY_KEYWORD_MAP } from "./constants";

const ECS_BASE = "https://result.election.gov.np";
const ECS_HANDLER = "/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/Common/";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.5",
};

// ─── Party slug helpers ───────────────────────────────────────────────────────

function slugifyParty(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, slug] of PARTY_KEYWORD_MAP) {
    if (lower.includes(keyword.toLowerCase())) return slug;
  }
  return "others";
}

/** Return English display name; falls back to original name if unknown. */
function partyEnglishName(slug: string, original: string): string {
  return PARTY_CONFIG[slug]?.name ?? original;
}

function parseVotes(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^0-9]/g, "");
  return parseInt(s, 10) || 0;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, " ")  // strip non-ASCII (Nepali chars)
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ─── Session with CSRF ────────────────────────────────────────────────────────

async function createAuthClient(): Promise<AxiosInstance | null> {
  try {
    // 1. GET homepage to obtain session + CSRF cookies
    const init = await axios.get(ECS_BASE + "/", {
      headers: { ...BROWSER_HEADERS, Accept: "text/html,application/xhtml+xml,*/*" },
      timeout: 20000,
      withCredentials: true,
    });

    // 2. Extract cookies from Set-Cookie headers
    const setCookies: string[] = [];
    const rawCookies = init.headers["set-cookie"] ?? [];
    if (Array.isArray(rawCookies)) setCookies.push(...rawCookies);

    let csrfToken = "";
    const cookieHeader: string[] = [];

    for (const c of setCookies) {
      const pair = c.split(";")[0];
      cookieHeader.push(pair);
      const [name, value] = pair.split("=");
      if (name?.toLowerCase().includes("csrftoken") || name === "CsrfToken") {
        csrfToken = value ?? "";
      }
    }

    if (!csrfToken) {
      console.warn("[scraper] No CSRF token in cookies — requests may fail");
    }

    const client = axios.create({
      baseURL: ECS_BASE,
      timeout: 25000,
      headers: {
        ...BROWSER_HEADERS,
        Accept: "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        Referer: ECS_BASE + "/",
        "X-CSRF-Token": csrfToken,
        Cookie: cookieHeader.join("; "),
      },
    });

    return client;
  } catch (err) {
    console.error("[scraper] Could not create session:", err);
    return null;
  }
}

// ─── JSON fetcher with retry / back-off ──────────────────────────────────────

async function fetchJSON<T = unknown>(
  client: AxiosInstance,
  filename: string,
  retries = 5,
  baseDelay = 2000
): Promise<T | null> {
  const url = ECS_HANDLER + filename;
  for (let attempt = 0; attempt < retries; attempt++) {
    if (attempt > 0) {
      const wait = baseDelay * 2 ** (attempt - 1);
      console.log(`[scraper] retry ${attempt} for ${filename} (${wait}ms)`);
      await new Promise((r) => setTimeout(r, wait));
    }
    try {
      const { data, status } = await client.get(url);
      if (status === 503) { console.warn(`[scraper] ${filename}: rate-limited`); continue; }
      console.log(`[scraper] ${filename}: ${Array.isArray(data) ? data.length : 1} records`);
      return data as T;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) return null;
        if (err.response?.status === 503) continue;
        console.warn(`[scraper] ${filename}: HTTP ${err.response?.status}`);
      } else {
        console.warn(`[scraper] ${filename}:`, err);
      }
    }
  }
  return null;
}

// ─── Raw data types from ECS site ─────────────────────────────────────────────

interface EcsPartyItem {
  PartyId: number;
  PoliticalPartyName: string;
  TotWin: number;
  TotLead: number;
  TotWinLead: number;
  SymbolID: number;
}

type EcsConstItem = Record<string, unknown>;
type EcsCandItem = Record<string, unknown>;

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parsePartyStandings(raw: EcsPartyItem[]): PartySeats[] {
  return raw
    .map((item) => {
      const slug = slugifyParty(item.PoliticalPartyName);
      return {
        // Use English name from PARTY_CONFIG; keep Nepali as fallback
        party:          partyEnglishName(slug, item.PoliticalPartyName),
        partyNepali:    item.PoliticalPartyName,
        partySlug:      slug,
        partyColor:     getPartyColor(slug),
        seats:          Number(item.TotWin ?? 0),
        leading:        Number(item.TotLead ?? 0),
        totalVotes:     0,
        votePercentage: 0,
      } satisfies PartySeats;
    })
    .sort((a, b) => (b.seats + b.leading) - (a.seats + a.leading));
}

function parseConstituencies(
  constRaw: EcsConstItem[],
  candRaw: EcsCandItem[]
): ConstituencyResult[] {
  if (!constRaw.length) return [];

  // Log actual keys for debugging
  console.log("[scraper] constituency keys:", Object.keys(constRaw[0]).join(", "));
  if (candRaw.length) console.log("[scraper] candidate keys:", Object.keys(candRaw[0]).join(", "));

  // Index candidates by constituency ID
  const byConst = new Map<string, EcsCandItem[]>();
  for (const c of candRaw) {
    const cid = String(pick(c, "ScConstId", "ConstId", "constId", "ConstituencyId", "ConstNo") ?? "");
    if (cid) {
      if (!byConst.has(cid)) byConst.set(cid, []);
      byConst.get(cid)!.push(c);
    }
  }

  const results: ConstituencyResult[] = [];

  for (const item of constRaw) {
    const cid = String(pick(item, "ScConstId", "ConstId", "constId", "ConstituencyId", "ConstNo") ?? "");
    const name = String(pick(item, "ScConstName", "ConstName", "ConstituencyName", "ConstitutencyName") ?? `Const-${cid}`);
    const district = String(pick(item, "DistrictName", "districtName", "District") ?? "");
    const provinceNum = Number(pick(item, "StateId", "stateId", "ProvinceId") ?? 0);

    // Counting status
    const rawStatus = String(pick(item, "Status", "status", "CountingStatus", "ResultStatus") ?? "").toLowerCase();
    let countingStatus: ConstituencyResult["countingStatus"] = "not-started";
    if (["complete", "declared", "final", "3"].some((x) => rawStatus.includes(x))) {
      countingStatus = "complete";
    } else if (["count", "progress", "ongoing", "1", "2"].some((x) => rawStatus.includes(x))) {
      countingStatus = "counting";
    }

    const countedPct = Number(
      pick(item, "CountedPct", "countedPct", "CountingPct", "PercentCounted")
      ?? (countingStatus === "complete" ? 100 : 0)
    );

    // Build candidates
    const rawCands = byConst.get(cid) ?? [];
    const candidates: CandidateResult[] = [];

    for (const c of rawCands) {
      // Try English name fields first (ECS API may provide them)
      const cnameEng = String(
        pick(c, "CandidateNameEng", "CandidateNameEnglish", "CandidateEngName",
             "NameEng", "NameEnglish", "EnglishName") ?? ""
      );
      const cname = cnameEng ||
        String(pick(c, "CandidateName", "candidateName", "Name", "FullName") ?? "");

      const pnameRaw = String(
        pick(c, "PoliticalPartyName", "partyName", "Party", "PartyName",
             "PoliticalPartyNameEng") ?? ""
      );
      const votes = parseVotes(pick(c, "VoteCount", "voteCount", "Votes", "TotalVote", "ValidVote"));
      const winnerRaw = pick(c, "IsWinner", "isWinner", "Winner", "ResultStatus");
      const isWinner = [true, 1, "1", "W", "Winner", "winner", "true"].includes(winnerRaw as never);

      if (!cname) continue;

      const pslug = slugifyParty(pnameRaw);
      const pname = partyEnglishName(pslug, pnameRaw);
      candidates.push({
        id:         `${cid}-${candidates.length}`,
        name:       cname,
        party:      pname,
        partySlug:  pslug,
        partyColor: getPartyColor(pslug),
        votes,
        percentage: 0,
        status:     isWinner ? "elected" : "trailing",
        isWinner,
      });
    }

    if (!candidates.length) continue;

    candidates.sort((a, b) => b.votes - a.votes);
    const total = candidates.reduce((s, c) => s + c.votes, 0);
    candidates.forEach((c, i) => {
      c.percentage = total ? Math.round((c.votes / total) * 1000) / 10 : 0;
      if (!c.isWinner) c.status = i === 0 ? "leading" : "trailing";
    });

    const winner = candidates.find((c) => c.isWinner);
    const entry: ConstituencyResult = {
      id:               cid,
      slug:             toSlug(name) || cid,
      name,
      district,
      province:         provinceNum ? `Province ${provinceNum}` : "",
      provinceNumber:   provinceNum,
      type:             "FPTP",
      candidates,
      totalVotes:       total,
      countingStatus,
      countedPercentage: countedPct,
      lastUpdated:      new Date().toISOString(),
      ...(winner ? { winner } : {}),
      ...((!winner && countingStatus === "counting" && candidates[0]) ? { leader: candidates[0] } : {}),
    };

    results.push(entry);
  }

  return results;
}

// ─── R2 Fallback (nepalvotes.live public bucket) ────────────────────────────

const R2_BASE = "https://pub-4173e04d0b78426caa8cfa525f827daa.r2.dev";

interface R2Candidate {
  candidateId: number;
  name: string;
  nameNp: string;
  partyName: string;
  partyId: string;
  votes: number;
  isWinner: boolean;
}

interface R2Constituency {
  province: string;
  district: string;
  districtNp: string;
  code: string;
  name: string;
  nameNp: string;
  status: "PENDING" | "COUNTING" | "DECLARED" | string;
  lastUpdated: string;
  candidates: R2Candidate[];
  votesCast: number;
  totalVoters: number;
}

export async function scrapeFromR2(): Promise<ElectionData | null> {
  try {
    const res = await axios.get<R2Constituency[]>(`${R2_BASE}/constituencies.json`, {
      timeout: 20000,
      headers: { ...BROWSER_HEADERS },
    });

    const raw = res.data;
    if (!Array.isArray(raw) || raw.length === 0) return null;

    console.log(`[r2] ${raw.length} constituencies fetched`);

    const constituencies: ConstituencyResult[] = [];

    for (const item of raw) {
      const statusLower = (item.status ?? "").toLowerCase();
      let countingStatus: ConstituencyResult["countingStatus"] = "not-started";
      if (statusLower === "declared" || statusLower === "complete") countingStatus = "complete";
      else if (statusLower === "counting") countingStatus = "counting";

      const candidates: CandidateResult[] = (item.candidates ?? [])
        .map((c, i) => {
          const pslug = slugifyParty(c.partyName);
          return {
            id:         `${item.code}-${i}`,
            name:       c.name || c.nameNp,
            nameNepali: c.nameNp,
            party:      partyEnglishName(pslug, c.partyName),
            partySlug:  pslug,
            partyColor: getPartyColor(pslug),
            votes:      c.votes ?? 0,
            percentage: 0,
            status:     c.isWinner ? "elected" as const : "trailing" as const,
            isWinner:   c.isWinner,
          };
        })
        .sort((a, b) => b.votes - a.votes);

      const total = candidates.reduce((s, c) => s + c.votes, 0);
      candidates.forEach((c, i) => {
        c.percentage = total ? Math.round((c.votes / total) * 1000) / 10 : 0;
        if (!c.isWinner) c.status = i === 0 ? "leading" : "trailing";
      });

      const winner = candidates.find((c) => c.isWinner);

      constituencies.push({
        id:               item.code,
        slug:             toSlug(item.name) || item.code,
        name:             item.name,
        nameNepali:       item.nameNp,
        district:         item.district,
        province:         item.province,
        provinceNumber:   0,
        type:             "FPTP",
        candidates,
        totalVotes:       total,
        totalVoters:      item.totalVoters,
        countingStatus,
        countedPercentage: countingStatus === "complete" ? 100 : (total > 0 ? 50 : 0),
        lastUpdated:      item.lastUpdated ?? new Date().toISOString(),
        ...(winner ? { winner } : {}),
      });
    }

    // Build party seats from constituency results
    const seatMap = new Map<string, { party: string; partyNepali: string; partySlug: string; partyColor: string; seats: number; leading: number; votes: number }>();
    for (const c of constituencies) {
      const leader = c.candidates[0];
      if (!leader) continue;
      const slug = leader.partySlug;
      const existing = seatMap.get(slug) ?? {
        party: leader.party,
        partyNepali: "",
        partySlug: slug,
        partyColor: leader.partyColor,
        seats: 0,
        leading: 0,
        votes: 0,
      };
      if (c.countingStatus === "complete" && c.winner?.partySlug === slug) existing.seats++;
      else if (c.countingStatus === "counting") existing.leading++;
      existing.votes += c.totalVotes;
      seatMap.set(slug, existing);
    }

    const partySeats: PartySeats[] = [...seatMap.values()]
      .map((p) => ({
        party:          p.party,
        partyNepali:    p.partyNepali,
        partySlug:      p.partySlug,
        partyColor:     p.partyColor,
        seats:          p.seats,
        leading:        p.leading,
        totalVotes:     p.votes,
        votePercentage: 0,
      }))
      .sort((a, b) => (b.seats + b.leading) - (a.seats + a.leading));

    const declared   = constituencies.filter((c) => c.countingStatus === "complete").length;
    const counting   = constituencies.filter((c) => c.countingStatus === "counting").length;
    const notStarted = constituencies.length - declared - counting;

    return {
      constituencies,
      national: {
        totalConstituencies: Math.max(constituencies.length, 165),
        resultsDeclared:     declared,
        counting,
        notStarted,
        partySeats,
        totalVotesCounted:   constituencies.reduce((s, c) => s + c.totalVotes, 0),
        lastUpdated:         new Date().toISOString(),
      },
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[r2] Failed to fetch from R2:", err);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Main scrape function — tries ECS first, falls back to nepalvotes.live R2 bucket */
export async function scrapeElectionData(): Promise<ElectionData | null> {
  const client = await createAuthClient();
  if (!client) return null;

  // Party standings — most reliable endpoint (confirmed working)
  const partyRaw = await fetchJSON<EcsPartyItem[]>(client, "HoRPartyTop5.txt", 4, 1500);
  await new Promise((r) => setTimeout(r, 1500));

  // Constituency + candidate data
  const constRaw = await fetchJSON<EcsConstItem[]>(client, "FPTPConstituency.txt", 5, 2000);
  await new Promise((r) => setTimeout(r, 1500));
  const candRaw = await fetchJSON<EcsCandItem[]>(client, "FPTPCandidate.txt", 5, 2000);

  if (!partyRaw && !constRaw) {
    console.log("[scraper] ECS returned nothing — trying R2 fallback");
    return scrapeFromR2();
  }

  const partySeats    = parsePartyStandings(partyRaw ?? []);
  const constituencies = parseConstituencies(constRaw ?? [], candRaw ?? []);

  const declared    = constituencies.filter((c) => c.countingStatus === "complete").length;
  const counting    = constituencies.filter((c) => c.countingStatus === "counting").length;
  const notStarted  = constituencies.length - declared - counting;
  const totalVotes  = constituencies.reduce((s, c) => s + c.totalVotes, 0);

  const national: NationalStats = {
    totalConstituencies: Math.max(constituencies.length, 165),
    resultsDeclared:     declared,
    counting,
    notStarted,
    partySeats,
    totalVotesCounted:   totalVotes,
    lastUpdated:         new Date().toISOString(),
  };

  return {
    constituencies,
    national,
    scrapedAt: new Date().toISOString(),
  };
}


