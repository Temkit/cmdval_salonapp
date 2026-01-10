"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps {
  children: React.ReactNode;
  mode?: "polite" | "assertive";
  className?: string;
  /** Visually hide the region but keep it accessible to screen readers */
  visuallyHidden?: boolean;
}

/**
 * Announces dynamic content changes to screen readers
 */
export function LiveRegion({
  children,
  mode = "polite",
  className,
  visuallyHidden = false,
}: LiveRegionProps) {
  return (
    <div
      aria-live={mode}
      aria-atomic="true"
      className={cn(
        visuallyHidden && "sr-only",
        className
      )}
    >
      {children}
    </div>
  );
}

interface AnnouncerProps {
  message: string;
  mode?: "polite" | "assertive";
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = React.useState<string>("");

  const announce = React.useCallback((message: string) => {
    // Clear first to ensure repeated messages are announced
    setAnnouncement("");
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const Announcer = React.useCallback(
    ({ mode = "polite" }: { mode?: "polite" | "assertive" }) => (
      <LiveRegion mode={mode} visuallyHidden>
        {announcement}
      </LiveRegion>
    ),
    [announcement]
  );

  return { announce, Announcer };
}
