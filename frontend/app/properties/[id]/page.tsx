"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { MapPin, Send, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getMoveInSuggestions, getProperties, getPropertyById, bookVisit, messageOwner } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";
import { PropertyCard } from "@/components/property/property-card";

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const { userId, city } = useUserStore();
  const [visitDateTime, setVisitDateTime] = useState("");
  const [message, setMessage] = useState("Hi, I’d like to know more about this property and book a visit.");

  const [propertyQuery, suggestionsQuery, similarQuery] = useQueries({
    queries: [
      { queryKey: ["property", propertyId, city], queryFn: () => getPropertyById(propertyId, city) },
      { queryKey: ["move-in", propertyId], queryFn: () => getMoveInSuggestions(propertyId) },
      { queryKey: ["similar", city], queryFn: () => getProperties({ city, limit: 6 }) }
    ]
  });

  const property = propertyQuery.data;
  const similar = useMemo(() => (similarQuery.data || []).filter((item) => item.propertyId !== propertyId).slice(0, 3), [similarQuery.data, propertyId]);

  const onBookVisit = async () => {
    if (!userId || !visitDateTime) return toast.error("Add a user and select a visit time.");
    try {
      await bookVisit({ userId, propertyId, visitDateTime });
      toast.success("Visit request sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Visit failed");
    }
  };

  const onMessageOwner = async () => {
    if (!userId) return toast.error("Add a user first.");
    try {
      await messageOwner({ senderId: userId, propertyId, message });
      toast.success("Message delivered to owner");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Message failed");
    }
  };

  if (propertyQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6"><Skeleton className="h-[520px] w-full rounded-[32px]" /></main>;
  }

  if (!property) {
    return <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6"><Card>Property not found. This frontend uses your current <code>/properties</code> list endpoint to resolve detail pages.</Card></main>;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative min-h-[380px] overflow-hidden rounded-[32px] md:col-span-2">
            <Image src={property.gallery[0]} alt={property.title} fill className="object-cover" />
          </div>
          {property.gallery.slice(1).map((image) => (
            <div key={image} className="relative min-h-[200px] overflow-hidden rounded-[28px]">
              <Image src={image} alt={property.title} fill className="object-cover" />
            </div>
          ))}
        </div>
        <Card className="space-y-6">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-primary">Property details</div>
            <h1 className="mt-2 text-4xl font-semibold">{property.title}</h1>
            <div className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{property.subtitle || "Location unavailable"}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Type</div><div className="mt-2 font-semibold">{property.propertyType || "Not available"}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Parking</div><div className="mt-2 font-semibold">{property.parking || "Not available"}</div></Card>
          </div>
          <div>
            <div className="text-sm font-medium">AI move-in suggestions</div>
            <div className="mt-3 space-y-3">
              {suggestionsQuery.isLoading ? <Skeleton className="h-24 w-full" /> : suggestionsQuery.data?.map((item) => <Card key={item} className="p-4 text-sm">{item}</Card>)}
            </div>
          </div>
          <div className="rounded-[28px] border border-border/60 bg-gradient-to-r from-cyan-500/10 to-transparent p-5">
            <div className="text-sm font-medium">Map-based discovery</div>
            <p className="mt-2 text-sm text-muted-foreground">Drop in a Leaflet or Google Maps canvas here using <code>latitude</code> and <code>longitude</code> from the existing property payload.</p>
            <div className="mt-4 grid h-40 place-items-center rounded-[24px] border border-dashed border-border/70 text-sm text-muted-foreground">Map preview shell</div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium"><CalendarRange className="h-4 w-4 text-primary" /> Visit scheduling</div>
          <Input type="datetime-local" value={visitDateTime} onChange={(e) => setVisitDateTime(e.target.value)} />
          <Button onClick={onBookVisit}>Book visit</Button>
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Send className="h-4 w-4 text-primary" /> Contact owner</div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={onMessageOwner}>Send message</Button>
        </Card>
      </section>

      <section>
        <div className="mb-4">
          <div className="text-sm uppercase tracking-[0.24em] text-primary">Similar properties</div>
          <h2 className="mt-2 text-3xl font-semibold">More homes from the same city feed</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {similar.map((item) => <PropertyCard key={item.propertyId} property={item} />)}
        </div>
      </section>
    </main>
  );
}
