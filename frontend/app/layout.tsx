import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { SiteShell } from "@/components/site-shell";
import { FloatingAssistant } from "@/components/ai/floating-assistant";

export const metadata: Metadata = {
  title: "Zuntra",
  description: "Premium AI-powered real estate and roommate discovery platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
          <FloatingAssistant />
        </Providers>
      </body>
    </html>
  );
}
