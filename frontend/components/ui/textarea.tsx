import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("flex min-h-28 w-full rounded-[24px] border border-border/70 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-primary/50 dark:bg-white/5", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
