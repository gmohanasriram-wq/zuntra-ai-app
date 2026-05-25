"use client";

import Link from "next/link";
import { Home, LayoutDashboard, MessageSquareText, Users, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquareText },
  { href: "/roommates", label: "Roommates", icon: Users },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan-400 text-sm font-semibold text-white shadow-glass">Z</div>
            <div>
              <div className="text-sm font-semibold tracking-[0.24em] text-primary">ZUNTRA</div>
              <div className="text-xs text-muted-foreground">AI real estate intelligence</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5">
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/60 px-4 py-10 text-sm text-muted-foreground lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row">
          <p>Premium property discovery, semantic search, and roommate intelligence for modern urban living.</p>
          <p>Built with Next.js 15, TypeScript, Tailwind, Framer Motion, and your Flask APIs.</p>
        </div>
      </footer>
    </div>
  );
}
