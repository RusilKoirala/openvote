"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const AUTO_REFRESH_MS = 30_000;

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_MS / 1000);
  const nextRefreshAt = useRef(Date.now() + AUTO_REFRESH_MS);

  function doRefresh() {
    startTransition(() => {
      router.refresh();
      setLastUpdated(new Date());
      nextRefreshAt.current = Date.now() + AUTO_REFRESH_MS;
    });
  }

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(doRefresh, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  // Countdown tick every second
  useEffect(() => {
    const tick = setInterval(() => {
      const secs = Math.max(0, Math.round((nextRefreshAt.current - Date.now()) / 1000));
      setCountdown(secs);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={doRefresh}
        disabled={isPending}
        className="gap-1.5 text-xs"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Updating…" : `Refresh ${countdown}s`}
      </Button>
    </div>
  );
}
