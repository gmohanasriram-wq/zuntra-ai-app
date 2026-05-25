"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyCard } from "@/components/property/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { getProperties, semanticSearch } from "@/lib/api/zuntra";

export default function PropertiesPage() {
  const [query, setQuery] = useState("parking-friendly 2BHK in Chennai");
  const [city, setCity] = useState("Chennai");
  const [type, setType] = useState("");
  const [semantic, setSemantic] = useState(true);

  const listing = useQuery({
    queryKey: ["properties", city, type, query, semantic],
    queryFn: () => semantic ? semanticSearch({ query, city, topK: 9 }) : getProperties({ city, propertyType: type || undefined, limit: 12 })
  });

  useEffect(() => {
    if (type) setSemantic(false);
  }, [type]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-primary">Property listing</div>
          <h1 className="mt-2 text-4xl font-semibold">Search, filter, and shortlist with AI-native discovery.</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Use semantic search for intent-driven discovery or switch to structured city and property type filters.</p>
        </div>
        <PropertyFilters query={query} setQuery={setQuery} city={city} setCity={setCity} type={type} setType={setType} onSearch={() => setSemantic(Boolean(query.trim()))} />
      </motion.div>

      <div className="mb-6 flex gap-3 text-sm">
        <button onClick={() => setSemantic(true)} className={`rounded-full px-4 py-2 ${semantic ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>AI semantic</button>
        <button onClick={() => setSemantic(false)} className={`rounded-full px-4 py-2 ${!semantic ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Structured filters</button>
      </div>

      {listing.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[390px] rounded-[28px]" />)}
        </div>
      ) : listing.isError ? (
        <Card className="text-sm text-rose-500">{listing.error instanceof Error ? listing.error.message : "Unable to load properties"}</Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listing.data?.map((property) => <PropertyCard key={property.propertyId} property={property} />)}
        </div>
      )}
    </main>
  );
}
