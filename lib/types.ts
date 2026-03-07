export type PartySlug =
  | "nc"
  | "uml"
  | "mc"
  | "rpp"
  | "janamat"
  | "rastriya-swatantra"
  | "others"
  | string;

export type CountingStatus = "not-started" | "counting" | "complete";
export type CandidateStatus = "leading" | "trailing" | "elected" | "lost";

export interface CandidateResult {
  id: string;
  name: string;
  nameNepali?: string;
  party: string;
  partySlug: PartySlug;
  partyColor: string;
  votes: number;
  percentage: number;
  status: CandidateStatus;
  isWinner?: boolean;
}

export interface ConstituencyResult {
  id: string;
  slug: string;
  name: string; // e.g. "Jhapa-5"
  nameNepali?: string;
  district: string;
  province: string;
  provinceNumber: number;
  type: "FPTP" | "PR";
  candidates: CandidateResult[];
  totalVotes: number;
  totalVoters?: number;
  countingStatus: CountingStatus;
  countedPercentage: number; // 0-100, how much counting is done
  lastUpdated: string; // ISO timestamp
  winner?: CandidateResult;
  isFeatured?: boolean;
}

export interface NationalStats {
  totalConstituencies: number;
  resultsDeclared: number;
  counting: number;
  notStarted: number;
  partySeats: PartySeats[];
  totalVotesCounted: number;
  lastUpdated: string;
}

export interface PartySeats {
  party: string;
  partyNepali?: string;
  partySlug: PartySlug;
  partyColor: string;
  seats: number;
  leading: number;
  totalVotes: number;
  votePercentage: number;
}

export interface ElectionData {
  constituencies: ConstituencyResult[];
  national: NationalStats;
  scrapedAt: string;
}
