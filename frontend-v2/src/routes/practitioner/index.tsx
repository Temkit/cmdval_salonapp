import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionStore } from "@/stores/session-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { WaitingQueueEntry } from "@/types";

export const Route = createFileRoute("/practitioner/")({
  component: PractitionerHomePage,
});

function formatWaitTime(checkedInAt: string): string {
  const diff = Date.now() - new Date(checkedInAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? `${mins.toString().padStart(2, "0")}` : ""}`;
}

function PractitionerHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { getSession } = useSessionStore();

  // Check for active session — redirect to timer
  const activeSession = user ? getSession(user.id) : null;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["queue", user?.id],
    queryFn: () => api.getQueue(user?.id ?? undefined),
    refetchInterval: 15000,
  });

  const callMutation = useMutation({
    mutationFn: (entryId: string) => api.callPatient(entryId),
    onSuccess: (_data, entryId) => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient appele" });
      // Find the entry to get patient_id for seance wizard
      const entry = waitingEntries.find((e) => e.id === entryId);
      if (entry?.patient_id) {
        navigate({
          to: "/practitioner/seance/$patientId",
          params: { patientId: entry.patient_id },
          search: { queueEntryId: entry.id },
        });
      }
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (entryId: string) => api.markNoShow(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient marque absent" });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    },
  });

  const entries = data?.entries ?? [];
  const waitingEntries = entries.filter((e) => e.status === "waiting");
  const inTreatmentEntries = entries.filter((e) => e.status === "in_treatment");
  const nextPatient: WaitingQueueEntry | undefined = waitingEntries[0];

  // If there's an active session, show a resume prompt
  if (activeSession) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold">Seance en cours</h2>
            <p className="text-muted-foreground">
              {activeSession.patientName} — {activeSession.zoneName}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                navigate({ to: "/practitioner/active" as string } as Parameters<typeof navigate>[0])
              }
            >
              Reprendre la seance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 max-w-2xl mx-auto">
      {/* In-treatment banner */}
      {inTreatmentEntries.length > 0 && (
        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {inTreatmentEntries.length} patient{inTreatmentEntries.length > 1 ? "s" : ""} en
                  traitement
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {inTreatmentEntries.map((e) => e.patient_name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next patient card */}
      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || "Impossible de charger la file d'attente"}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 skeleton rounded-2xl" />
              <div className="h-7 w-48 skeleton rounded" />
              <div className="h-5 w-32 skeleton rounded" />
              <div className="h-12 w-full skeleton rounded-xl mt-4" />
            </div>
          </CardContent>
        </Card>
      ) : nextPatient ? (
        <Card className="border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Patient avatar */}
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>

              {/* Patient name */}
              <div>
                <h2 className="text-2xl font-bold">{nextPatient.patient_name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatWaitTime(nextPatient.checked_in_at)}
                  </Badge>
                  {nextPatient.box_nom && (
                    <Badge variant="outline">{nextPatient.box_nom}</Badge>
                  )}
                </div>
              </div>

              {/* Call button */}
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={() => callMutation.mutate(nextPatient.id)}
                disabled={callMutation.isPending}
              >
                <Phone className="h-5 w-5 mr-2" />
                {callMutation.isPending ? "Appel..." : "Appeler"}
              </Button>

              {/* No-show button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => noShowMutation.mutate(nextPatient.id)}
                disabled={noShowMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Marquer absent
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={User}
          title="Aucun patient en attente"
          description="Les patients apparaitront ici apres leur check-in"
        />
      )}

      {/* Remaining queue */}
      {waitingEntries.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-muted-foreground">
              Suivants ({waitingEntries.length - 1})
            </h3>
            <Button variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {waitingEntries.slice(1).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.patient_name}
                      </p>
                    </div>
                    <Badge variant="muted" size="sm">
                      {formatWaitTime(entry.checked_in_at)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
