"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";

interface UseQueueEventsOptions {
  showToasts?: boolean;
  invalidateQueries?: boolean;
}

interface UseQueueEventsReturn {
  newCheckInCount: number;
  resetCount: () => void;
}

export function useQueueEvents(options: UseQueueEventsOptions = {}): UseQueueEventsReturn {
  const { showToasts = false, invalidateQueries = false } = options;
  const [newCheckInCount, setNewCheckInCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetCount = useCallback(() => setNewCheckInCount(0), []);

  useEffect(() => {
    const doctorId = user?.id;
    if (!doctorId) return;

    const url = `/api/v1/schedule/queue/events?doctor_id=${doctorId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("patient_checked_in", (event) => {
      setNewCheckInCount((prev) => prev + 1);

      // Play notification sound
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // ignore if audio not available
      }

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["queue"] });
      }

      if (showToasts) {
        try {
          const data = JSON.parse(event.data);
          toast({
            title: "Nouveau patient",
            description: `${data.patient_name} est arrivé${data.doctor_name ? ` (Dr. ${data.doctor_name})` : ""}`,
          });
        } catch {
          // ignore parse errors
        }
      }
    });

    es.addEventListener("ping", () => {});
    es.onerror = () => {};

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user?.id, queryClient, toast, showToasts, invalidateQueries]);

  // Reset when visiting salle-attente
  useEffect(() => {
    if (pathname.startsWith("/salle-attente")) {
      setNewCheckInCount(0);
    }
  }, [pathname]);

  return { newCheckInCount, resetCount };
}
