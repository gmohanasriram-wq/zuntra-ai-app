import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("flex h-11 w-full rounded-full border border-border/70 bg-white/70 px-4 text-sm outline-none ring-0 transition focus:border-primary/50 dark:bg-white/5", className)}
    {...props}
  />
));
Input.displayName = "Input";
