import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/types";

export function CompatibilityCard({ match }: { match: Match }) {
  const percentage = Math.min(100, match.score * 10);
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">{match.name}</div>
          <div className="text-sm text-muted-foreground">{match.mobile}</div>
        </div>
        <Badge>{percentage}% match</Badge>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.9 }} className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" />
      </div>
      <p className="text-sm text-muted-foreground">Aligned preferences across sleep, food, lifestyle, and cleaning rhythm based on your backend match score.</p>
    </Card>
  );
}
