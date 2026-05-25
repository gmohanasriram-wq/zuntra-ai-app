"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CarFront, Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { likeProperty } from "@/lib/api/zuntra";
import { useUserStore } from "@/lib/store/user-store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PropertyView } from "@/lib/types";

export function PropertyCard({ property }: { property: PropertyView }) {
  const [liked, setLiked] = useState(false);
  const { userId } = useUserStore();

  const onLike = async () => {
    if (!userId) {
      toast.error("Complete onboarding to like properties.");
      return;
    }
    const previous = liked;
    setLiked(true);
    try {
      await likeProperty({ userId, propertyId: property.propertyId });
      toast.success("Added to shortlist");
    } catch (error) {
      setLiked(previous);
      toast.error(error instanceof Error ? error.message : "Like failed");
    }
  };

  return (
    <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
      <Card className="group overflow-hidden p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image src={property.image} alt={property.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
          <button onClick={onLike} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-slate-900 backdrop-blur">
            <Heart className={`h-4 w-4 ${liked ? "fill-current text-rose-500" : ""}`} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{property.subtitle || "Location unavailable"}</div>
            </div>
            <Badge>{property.propertyType || "Property"}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><CarFront className="h-4 w-4" />{property.parking || "Parking info unavailable"}</span>
            {property.score ? <span>AI score {property.score.toFixed(2)}</span> : null}
          </div>
          <div className="flex gap-3">
            <Button asChild className="flex-1"><Link href={`/properties/${property.propertyId}`}>Book visit</Link></Button>
            <Button asChild variant="secondary" className="flex-1"><Link href={`/properties/${property.propertyId}`}>View details</Link></Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
