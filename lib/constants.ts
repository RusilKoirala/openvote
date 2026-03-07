export const PARTY_CONFIG: Record<
  string,
  { name: string; color: string; shortName: string; nepali?: string }
> = {
  nc: {
    name: "Nepali Congress",
    shortName: "NC",
    color: "#1565C0",
    nepali: "नेपाली काँग्रेस",
  },
  uml: {
    name: "CPN (Unified Marxist-Leninist)",
    shortName: "UML",
    color: "#EF4444",
    nepali: "नेकपा (एमाले)",
  },
  mc: {
    name: "CPN (Maoist Centre)",
    shortName: "MC",
    color: "#B91C1C",
    nepali: "नेकपा (माओवादी केन्द्र)",
  },
  "cpn-us": {
    name: "CPN (Unified Socialist)",
    shortName: "US",
    color: "#DC2626",
    nepali: "एकीकृत समाजवादी",
  },
  rpp: {
    name: "Rastriya Prajatantra Party",
    shortName: "RPP",
    color: "#F59E0B",
    nepali: "राष्ट्रिय प्रजातान्त्रिक पार्टी",
  },
  "rastriya-swatantra": {
    name: "Rastriya Swatantra Party",
    shortName: "RSP",
    color: "#10B981",
    nepali: "राष्ट्रिय स्वतन्त्र पार्टी",
  },
  janamat: {
    name: "Janamat Party",
    shortName: "JP",
    color: "#8B5CF6",
    nepali: "जनमत पार्टी",
  },
  lsp: {
    name: "Loktantrik Samajwadi Party",
    shortName: "LSP",
    color: "#F97316",
    nepali: "लोकतान्त्रिक समाजवादी पार्टी",
  },
  nagarik: {
    name: "Nagarik Unmukti Party",
    shortName: "NUP",
    color: "#06B6D4",
    nepali: "नागरिक उन्मुक्ति पार्टी",
  },
  ujyalo: {
    name: "Ujyalo Nepal Party",
    shortName: "UNP",
    color: "#FBBF24",
    nepali: "उज्यालो नेपाल पार्टी",
  },
  naya: {
    name: "Naya Shakti Party",
    shortName: "NSP",
    color: "#A78BFA",
    nepali: "नयाँ शक्ति पार्टी",
  },
  others: {
    name: "Others / Independent",
    shortName: "IND",
    color: "#6B7280",
  },
};

/**
 * Keyword → slug mapping used by both the TS and Python scrapers.
 * Order matters — more specific entries come first.
 * Each entry is [substring_to_match, slug].
 */
export const PARTY_KEYWORD_MAP: [string, string][] = [
  // English
  ["nepali congress",       "nc"],
  ["nepalese congress",     "nc"],
  ["cpn-uml",               "uml"],
  ["unified marxist",       "uml"],
  ["maoist",                "mc"],
  ["rastriya swatantra",    "rastriya-swatantra"],
  ["swatantra party",       "rastriya-swatantra"],
  ["rastriya prajatantra",  "rpp"],
  ["prajatantra",           "rpp"],
  ["janamat",               "janamat"],
  ["loktantrik samajwadi",  "lsp"],
  ["loktantrik",            "lsp"],
  ["nagarik unmukti",       "nagarik"],
  ["nagarik",               "nagarik"],
  ["ujyalo nepal",          "ujyalo"],
  ["ujyalo",                "ujyalo"],
  ["unified socialist",     "cpn-us"],
  // Nepali unicode
  ["काँग्रेस",              "nc"],
  ["कांग्रेस",              "nc"],
  ["एकीकृत मार्क्सवादी",   "uml"],
  ["एमाले",                 "uml"],
  ["माओवादी",               "mc"],
  ["राष्ट्रिय स्वतन्त्र",  "rastriya-swatantra"],
  ["रास्वपा",               "rastriya-swatantra"],
  ["राष्ट्रिय प्रजातन्त्र","rpp"],
  ["राप्रपा",               "rpp"],
  ["जनमत",                  "janamat"],
  ["लोकतान्त्रिक",          "lsp"],
  ["नागरिक उन्मुक्ति",      "nagarik"],
  ["उज्यालो",               "ujyalo"],
  ["एकीकृत समाजवादी",       "cpn-us"],
  ["श्रम संस्कृति",          "others"],
];

export function getPartyColor(partySlug: string): string {
  return PARTY_CONFIG[partySlug]?.color ?? "#6B7280";
}

export function getPartyShortName(partySlug: string): string {
  return PARTY_CONFIG[partySlug]?.shortName ?? partySlug.toUpperCase();
}

export function getPartyFullName(partySlug: string): string {
  return PARTY_CONFIG[partySlug]?.name ?? partySlug;
}

export const NEPAL_PROVINCES = [
  { number: 1, name: "Koshi Province" },
  { number: 2, name: "Madhesh Province" },
  { number: 3, name: "Bagmati Province" },
  { number: 4, name: "Gandaki Province" },
  { number: 5, name: "Lumbini Province" },
  { number: 6, name: "Karnali Province" },
  { number: 7, name: "Sudurpashchim Province" },
];

export const FEATURED_CONSTITUENCY_SLUG = "jhapa-5";
