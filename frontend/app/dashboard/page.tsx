"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card } from "@/components/ui/card";
import { getProperties, getMatches } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";

export default function DashboardPage() {
  const { userId, name, city } = useUserStore();
  const properties = useQuery({ queryKey: ["dashboard-properties", city], queryFn: () => getProperties({ city, limit: 8 }) });
  const matches = useQuery({ queryKey: ["dashboard-matches", userId], queryFn: () => getMatches(userId as number), enabled: Boolean(userId) });

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
      <div>
        <div className="text-sm uppercase tracking-[0.24em] text-primary">Dashboard</div>
        <h1 className="mt-2 text-4xl font-semibold">Welcome back{name ? `, ${name}` : ""}.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">A polished overview for user profile, discovery analytics, saved intent, visits, messages, and AI suggestions.</p>
      </div>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active city" value={city || "Chennai"} hint="Used for semantic and list queries" />
        <MetricCard label="Property feed" value={String(properties.data?.length || 0)} hint="Fetched from /properties" />
        <MetricCard label="Roommate matches" value={String(matches.data?.length || 0)} hint="Fetched from /matches/:uid" />
        <MetricCard label="AI readiness" value="Live" hint="Chat, visits, likes, and messages are wired" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="text-sm font-medium">Profile card</div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>Name: {name || "Not registered"}</p>
            <p>User ID: {userId || "Connect from onboarding"}</p>
            <p>Primary city: {city || "Chennai"}</p>
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium">Backend-aware notes</div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Saved properties, visit history, and inbox views should use new read endpoints later; current backend already supports create actions through /like, /visit, and /message.</li>
            <li>The detail page currently resolves a single property from the existing /properties list response because no HTTP /properties/:id endpoint is exposed yet.</li>
            <li>Map discovery can be made live immediately with the latitude and longitude already returned by your property model.</li>
          </ul>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-medium">AI recommendations</div>
          <div className="mt-4 space-y-3">
            {(properties.data || []).slice(0, 3).map((property) => (
              <div key={property.propertyId} className="rounded-[22px] border border-border/60 p-4">
                <div className="font-medium">{property.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{property.subtitle}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium">Analytics shell</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] bg-muted/40 p-4"><div className="text-xs text-muted-foreground">Search intent</div><div className="mt-3 text-2xl font-semibold">92%</div></div>
            <div className="rounded-[22px] bg-muted/40 p-4"><div className="text-xs text-muted-foreground">Visit conversion</div><div className="mt-3 text-2xl font-semibold">37%</div></div>
            <div className="rounded-[22px] bg-muted/40 p-4"><div className="text-xs text-muted-foreground">Reply speed</div><div className="mt-3 text-2xl font-semibold">4m</div></div>
            <div className="rounded-[22px] bg-muted/40 p-4"><div className="text-xs text-muted-foreground">Like momentum</div><div className="mt-3 text-2xl font-semibold">+18%</div></div>
          </div>
        </Card>
      </section>
    </main>
  );
}
