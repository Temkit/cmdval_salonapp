import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/display")({
  component: DisplayQueuePage,
});

function formatWaitTime(checkedInAt: string): string {
  const diff = Date.now() - new Date(checkedInAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

function DisplayQueuePage() {
  const [now, setNow] = useState(Date.now());

  // Refresh timer every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data } = useQuery({
    queryKey: ["display-queue"],
    queryFn: () => api.getDisplayQueue(),
    refetchInterval: 10000,
  });

  const entries = data?.entries ?? [];
  const waiting = entries.filter((e) => e.status === "waiting");
  const inTreatment = entries.filter((e) => e.status === "in_treatment");

  // Trigger re-render with `now`
  void now;

  return (
    <div className="min-h-screen bg-background p-6 sm:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/Logo_Optiskin_400x400.png" alt="Optiskin" className="h-12 w-12 object-contain" />
          <h1 className="text-2xl font-bold">Optiskin</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date())}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* In treatment */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-semibold">
              En traitement ({inTreatment.length})
            </h2>
          </div>
          <div className="space-y-3">
            {inTreatment.length > 0 ? (
              inTreatment.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50"
                >
                  <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">
                      {entry.patient_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {entry.doctor_name}
                      {entry.box_nom && ` — ${entry.box_nom}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucun patient en traitement</p>
              </div>
            )}
          </div>
        </div>

        {/* Waiting */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold">
              En attente ({waiting.length})
            </h2>
          </div>
          <div className="space-y-3">
            {waiting.length > 0 ? (
              waiting.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {entry.patient_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {entry.doctor_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                    <Clock className="h-4 w-4" />
                    {formatWaitTime(entry.checked_in_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucun patient en attente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
