import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
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

export function useQueueEvents(
  options: UseQueueEventsOptions = {},
): UseQueueEventsReturn {
  const { showToasts = false, invalidateQueries = false } = options;
  const [newCheckInCount, setNewCheckInCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetCount = useCallback(() => setNewCheckInCount(0), []);

  useEffect(() => {
    if (!user?.id) return;

    const isPractitioner = user.role_nom === "Praticien";
    const url = isPractitioner
      ? `/api/v1/schedule/queue/events?doctor_id=${user.id}`
      : `/api/v1/schedule/queue/events`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("patient_checked_in", (event) => {
      setNewCheckInCount((prev) => prev + 1);

      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.3,
        );
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // ignore if audio not available
      }

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["queue"] });
        queryClient.invalidateQueries({ queryKey: ["schedule"] });
      }

      if (showToasts) {
        try {
          const data = JSON.parse(event.data);
          toast({
            title: "Nouveau patient",
            description: `${data.patient_name} est arrive${data.doctor_name ? ` (Dr. ${data.doctor_name})` : ""}`,
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
  }, [
    user?.id,
    user?.role_nom,
    queryClient,
    toast,
    showToasts,
    invalidateQueries,
  ]);

  // Reset when visiting secretary queue
  useEffect(() => {
    const pathname = router.state.location.pathname;
    if (pathname === "/" || pathname.includes("secretary")) {
      setNewCheckInCount(0);
    }
  }, [router.state.location.pathname]);

  return { newCheckInCount, resetCount };
}
