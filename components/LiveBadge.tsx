"use client";

import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  counting?: boolean;
}

export function LiveBadge({ className, size = "md", counting = true }: LiveBadgeProps) {
  if (!counting) return null;

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-widest rounded-full",
        "bg-red-500 text-white",
        sizes[size],
        className
      )}
    >
      <Radio className="w-3 h-3 animate-pulse" aria-hidden />
      LIVE
    </span>
  );
}
