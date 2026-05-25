"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Sparkles, Stars, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { registerUser } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";

const featured = [
  { name: "Skyline Residences", place: "Nungambakkam, Chennai", tag: "AI ranked" },
  { name: "Harbor Square", place: "OMR, Chennai", tag: "Move-in ready" },
  { name: "Casa Verde", place: "Velachery, Chennai", tag: "Top roommate picks" }
];

export default function HomePage() {
  const [name, setName] = useState("Mohana");
  const [mobile, setMobile] = useState("9876543210");
  const [city, setCity] = useState("Chennai");
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const onRegister = async () => {
    setLoading(true);
    try {
      const data = await registerUser({ name, mobile, city });
      setUser({ userId: data.userId, name, mobile, city });
      toast.success("Profile connected to Zuntra AI");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="hero-grid relative overflow-hidden px-4 py-14 lg:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge>AI-powered property discovery + roommate matching</Badge>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[0.95] md:text-7xl">
              Discover your next home with <span className="text-primary">semantic search</span> and premium urban intelligence.
            </motion.h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Zuntra blends AI property search, move-in suggestions, visit orchestration, and compatibility-led roommate discovery into one startup-grade experience.
            </p>
            <div className="mt-8 flex flex-col gap-3 rounded-[32px] border border-border/60 bg-white/70 p-4 shadow-soft backdrop-blur-xl dark:bg-white/5 lg:flex-row">
              <Input placeholder="Search: 2BHK with parking near OMR and quiet neighborhood" className="flex-1" />
              <Button variant="secondary"><Mic className="h-4 w-4" />Voice</Button>
              <Button asChild><Link href="/properties">Start searching <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["24K+", "semantic queries/month"],
                ["91%", "visit intent precision"],
                ["4.8/5", "tenant satisfaction"]
              ].map(([value, label]) => (
                <Card key={label} className="p-5">
                  <div className="text-3xl font-semibold">{value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{label}</div>
                </Card>
              ))}
            </div>
          </div>
          <Card className="relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-aurora opacity-90" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> Elegant onboarding</div>
              <h2 className="text-3xl font-semibold">Connect your backend-ready user profile</h2>
              <p className="text-sm text-muted-foreground">This form calls your existing <code>/register</code> Flask API and stores the active user in client state.</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              <Button className="w-full" onClick={onRegister} disabled={loading}>{loading ? "Connecting..." : "Start with Zuntra AI"}</Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="px-4 py-12 lg:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Featured</p>
              <h2 className="mt-2 text-3xl font-semibold">Premium discovery surfaces</h2>
            </div>
            <Button asChild variant="secondary"><Link href="/properties">Explore inventory</Link></Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {featured.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <Card className="min-h-[220px] bg-gradient-to-br from-white to-cyan-50 dark:from-white/5 dark:to-cyan-500/10">
                  <Badge>{item.tag}</Badge>
                  <h3 className="mt-6 text-2xl font-semibold">{item.name}</h3>
                  <p className="mt-3 text-muted-foreground">{item.place}</p>
                  <div className="mt-10 flex items-center gap-2 text-sm text-primary"><Stars className="h-4 w-4" /> Personalized by semantic ranking, locality signals, and move-in readiness.</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 lg:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {[
            { icon: TrendingUp, title: "AI assistant", copy: "Use /chat for natural-language property recommendations, shortlisting, and quick discovery." },
            { icon: Users, title: "Roommate intelligence", copy: "Turn backend compatibility scores into premium match cards with motion-driven percentage bars." },
            { icon: Sparkles, title: "Move-in guidance", copy: "Surface backend-generated move-in suggestions directly inside property detail pages." }
          ].map((item) => (
            <Card key={item.title}>
              <item.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-5 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-muted-foreground">{item.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 py-12 lg:px-6">
        <div className="mx-auto max-w-7xl rounded-[36px] border border-border/60 bg-gradient-to-r from-slate-950 to-cyan-950 p-8 text-white shadow-glass">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">What users say</p>
              <h2 className="mt-3 text-3xl font-semibold">“Feels like Airbnb + Linear, but for high-intent urban renting.”</h2>
              <p className="mt-3 max-w-2xl text-cyan-50/80">Designed for polished real estate operations, semantic search, fast visit booking, and luxury-grade digital trust.</p>
            </div>
            <Button asChild variant="secondary"><Link href="/assistant">Open AI assistant</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}
