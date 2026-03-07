"use client";

import { useState, useMemo } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConstituencyCard } from "@/components/ConstituencyCard";
import type { ConstituencyResult } from "@/lib/types";

interface Props {
  constituencies: ConstituencyResult[];
  counting: ConstituencyResult[];
  complete: ConstituencyResult[];
  defaultTab?: string;
}

function ConstituencyGrid({ constituencies }: { constituencies: ConstituencyResult[] }) {
  if (constituencies.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No constituencies found</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {constituencies.map((c) => (
        <ConstituencyCard key={c.id} constituency={c} />
      ))}
    </div>
  );
}

const PROVINCES = [
  "All",
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export function ConstituencyList({ constituencies, counting, complete, defaultTab }: Props) {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All");

  const filter = (list: ConstituencyResult[]) => {
    let result = list;
    if (province !== "All") {
      result = result.filter((c) =>
        c.province.toLowerCase().includes(province.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameNepali?.includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.province.toLowerCase().includes(q) ||
          c.candidates.some((cand) => cand.name.toLowerCase().includes(q) || cand.party.toLowerCase().includes(q))
      );
    }
    return result;
  };

  const filteredCounting = useMemo(() => filter(counting), [counting, search, province]);
  const filteredComplete = useMemo(() => filter(complete), [complete, search, province]);
  const filteredAll = useMemo(() => filter(constituencies), [constituencies, search, province]);

  return (
    <div className="space-y-4">
      {/* Search + Province filter bar */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search constituency, candidate, party…"
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Province filter pills — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
          <div className="flex gap-1.5 w-max sm:w-auto sm:flex-wrap">
            {PROVINCES.map((p) => {
              const count = p === "All"
                ? constituencies.length
                : constituencies.filter((c) => c.province.toLowerCase().includes(p.toLowerCase())).length;
              return (
                <button
                  key={p}
                  onClick={() => setProvince(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                    province === p
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {p === "All" ? "All" : p}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab ?? (counting.length > 0 ? "counting" : "all")}>
        <TabsList>
          <TabsTrigger value="counting">
            Counting <span className="ml-1.5 text-xs opacity-70">({filteredCounting.length})</span>
          </TabsTrigger>
          <TabsTrigger value="complete">
            Declared <span className="ml-1.5 text-xs opacity-70">({filteredComplete.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all">
            All <span className="ml-1.5 text-xs opacity-70">({filteredAll.length})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="counting" className="mt-4">
          <ConstituencyGrid constituencies={filteredCounting} />
        </TabsContent>
        <TabsContent value="complete" className="mt-4">
          <ConstituencyGrid constituencies={filteredComplete} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <ConstituencyGrid constituencies={filteredAll} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
