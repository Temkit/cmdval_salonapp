"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Phone, CheckCircle, Users, Stethoscope, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const queueStatusConfig: Record<string, { label: string; variant: "info" | "warning" | "success"; pulse?: boolean }> = {
  waiting: { label: "En attente", variant: "info", pulse: true },
  in_treatment: { label: "En traitement", variant: "warning" },
  checked_in: { label: "En attente", variant: "info", pulse: true },
  called: { label: "Appele", variant: "warning" },
  done: { label: "Termine", variant: "success" },
  completed: { label: "Termine", variant: "success" },
};

interface QueueEntry {
  id: string;
  patient_name?: string;
  patient_prenom?: string;
  patient_nom?: string;
  doctor_name?: string;
  medecin?: string;
  doctor_id?: string;
  status: string;
  position?: number;
  checked_in_at?: string;
  time?: string;
  heure?: string;
}

export default function SalleAttentePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: queueData, isLoading } = useQuery({
    queryKey: ["queue"],
    queryFn: () => api.getQueue(),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const callMutation = useMutation({
    mutationFn: (entryId: string) => api.callPatient(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient appele" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (entryId: string) => api.completePatient(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Traitement termine" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const entries: QueueEntry[] = queueData?.entries || [];

  // Group entries by doctor
  const groupedByDoctor: Record<string, QueueEntry[]> = {};
  entries.forEach((entry) => {
    const doctorKey = entry.doctor_name || entry.medecin || "Non assigne";
    if (!groupedByDoctor[doctorKey]) {
      groupedByDoctor[doctorKey] = [];
    }
    groupedByDoctor[doctorKey].push(entry);
  });

  const doctorNames = Object.keys(groupedByDoctor).sort();

  const getPatientDisplayName = (entry: QueueEntry): string => {
    if (entry.patient_name) return entry.patient_name;
    const parts = [entry.patient_prenom, entry.patient_nom].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Patient";
  };

  const waitingCount = entries.filter(
    (e) => e.status === "waiting" || e.status === "checked_in"
  ).length;
  const inTreatmentCount = entries.filter(
    (e) => e.status === "in_treatment" || e.status === "called"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Salle d'attente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {waitingCount} en attente, {inTreatmentCount} en traitement
            {autoRefresh && " - Actualisation automatique"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["queue"] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{waitingCount}</p>
            <p className="text-sm text-muted-foreground mt-1">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{inTreatmentCount}</p>
            <p className="text-sm text-muted-foreground mt-1">En traitement</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{entries.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue by doctor */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Chargement de la file">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-6 w-40 skeleton rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="h-8 w-8 skeleton rounded-full" />
                      <div className="flex-1 space-y-1">
                        <div className="h-5 w-28 skeleton rounded" />
                        <div className="h-4 w-20 skeleton rounded" />
                      </div>
                      <div className="h-6 w-20 skeleton rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : doctorNames.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {doctorNames.map((doctorName) => {
            const doctorEntries = groupedByDoctor[doctorName];
            return (
              <Card key={doctorName}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Dr. {doctorName}
                    <Badge variant="secondary" className="ml-auto">
                      {doctorEntries.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {doctorEntries.map((entry, index) => {
                      const statusConf = queueStatusConfig[entry.status] || queueStatusConfig.waiting;
                      const isWaiting = entry.status === "waiting" || entry.status === "checked_in";
                      const isInTreatment = entry.status === "in_treatment" || entry.status === "called";

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                            isInTreatment ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : ""
                          }`}
                        >
                          {/* Position */}
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            isWaiting
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : isInTreatment
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          }`}>
                            {entry.position ?? index + 1}
                          </div>

                          {/* Patient info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getPatientDisplayName(entry)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.heure || entry.time || ""}
                              {entry.checked_in_at && ` - Arrive a ${new Date(entry.checked_in_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                            </p>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={statusConf.variant}
                              dot
                              className={statusConf.pulse ? "animate-pulse" : ""}
                            >
                              {statusConf.label}
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            {isWaiting && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => callMutation.mutate(entry.id)}
                                disabled={callMutation.isPending}
                                title="Appeler le patient"
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Appeler
                              </Button>
                            )}
                            {isInTreatment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => completeMutation.mutate(entry.id)}
                                disabled={completeMutation.isPending}
                                title="Terminer le traitement"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Terminer
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Salle d'attente vide</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Aucun patient en attente pour le moment. Les patients apparaitront ici apres leur check-in.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
