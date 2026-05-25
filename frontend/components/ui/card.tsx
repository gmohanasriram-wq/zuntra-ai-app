import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[28px] border border-border/60 bg-white/70 p-6 shadow-soft backdrop-blur-xl dark:bg-white/5", className)} {...props} />;
}
