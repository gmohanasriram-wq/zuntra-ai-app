"use client";

import { useQuery } from "@tanstack/react-query";
import { CompatibilityCard } from "@/components/roommate/compatibility-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMatches } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";

export default function RoommatesPage() {
  const userId = useUserStore((state) => state.userId);
  const matches = useQuery({
    queryKey: ["matches", userId],
    queryFn: () => getMatches(userId as number),
    enabled: Boolean(userId)
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <div className="mb-8">
        <div className="text-sm uppercase tracking-[0.24em] text-primary">Roommate matching</div>
        <h1 className="mt-2 text-4xl font-semibold">Compatibility-led co-living discovery.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">This page consumes your <code>/matches/:uid</code> endpoint and turns raw score output into clean premium match visuals.</p>
      </div>
      {!userId ? (
        <Card>Complete onboarding on the landing page to fetch match recommendations.</Card>
      ) : matches.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-[28px]" />)}</div>
      ) : matches.data?.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{matches.data.map((match) => <CompatibilityCard key={match.userId} match={match} />)}</div>
      ) : (
        <Card>No high-confidence matches yet. Add preferences through your backend roommate flow to populate this screen.</Card>
      )}
    </main>
  );
}
