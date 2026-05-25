"use client";

import { Mic, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PropertyFilters({ query, setQuery, city, setCity, type, setType, onSearch }: { query: string; setQuery: (value: string) => void; city: string; setCity: (value: string) => void; type: string; setType: (value: string) => void; onSearch: () => void; }) {
  return (
    <div className="grid gap-3 rounded-[28px] border border-border/60 bg-white/70 p-4 shadow-soft backdrop-blur-xl dark:bg-white/5 lg:grid-cols-[1.8fr_1fr_1fr_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Semantic AI search: family-friendly 2BHK near metro with parking" />
      </div>
      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
      <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Property type" />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onSearch}>Search</Button>
        <Button variant="secondary" size="default" aria-label="Voice search"><Mic className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
