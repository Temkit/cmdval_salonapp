import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  CheckCircle,
  Users,
  Stethoscope,
  RefreshCw,
  DoorOpen,
  ArrowRightLeft,
  XCircle,
  LogOut,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PaiementType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useQueueEvents } from "@/hooks/use-queue-events";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/secretary/")({
  component: SecretaryQueuePage,
});

const queueStatusConfig: Record<
  string,
  { label: string; variant: "info" | "warning" | "success" | "destructive"; pulse?: boolean }
> = {
  waiting: { label: "En attente", variant: "info", pulse: true },
  in_treatment: { label: "En traitement", variant: "warning" },
  checked_in: { label: "En attente", variant: "info", pulse: true },
  called: { label: "Appele", variant: "warning" },
  done: { label: "Termine", variant: "success" },
  completed: { label: "Termine", variant: "success" },
  no_show: { label: "Absent", variant: "destructive" },
  left: { label: "Parti", variant: "destructive" },
};

interface QueueEntry {
  id: string;
  patient_name?: string;
  patient_prenom?: string;
  patient_nom?: string;
  doctor_name?: string;
  medecin?: string;
  patient_id?: string | null;
  doctor_id?: string | null;
  box_id?: string | null;
  box_nom?: string | null;
  status: string;
  position?: number;
  checked_in_at?: string;
  time?: string;
  heure?: string;
  zone_names?: string[];
  patient_code_carte?: string | null;
  patient_telephone?: string | null;
}

function SecretaryQueuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, hasPermission } = useAuthStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reassignEntry, setReassignEntry] = useState<QueueEntry | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [paymentEntry, setPaymentEntry] = useState<QueueEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const canReassign =
    user?.role_nom === "Admin" || user?.role_nom === "Secretaire";
  const { newCheckInCount: newCheckIns, resetCount } = useQueueEvents({
    showToasts: true,
    invalidateQueries: true,
  });

  const { data: queueData, isLoading } = useQuery({
    queryKey: ["queue"],
    queryFn: () => api.getQueue(),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const callMutation = useMutation({
    mutationFn: (entry: QueueEntry) => api.callPatient(entry.id),
    onSuccess: (data, entry) => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      const patientId = data?.patient_id || entry.patient_id;
      if (!patientId) {
        toast({
          title: "Patient appele",
          description:
            "Patient non lie au systeme. Ouvrez sa fiche pour demarrer la seance.",
        });
        return;
      }
      toast({ title: "Patient appele" });
      navigate({
        to: "/secretary/patients/$id" as string,
        params: { id: patientId },
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (entryId: string) => api.markNoShow(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient marque absent" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const leftMutation = useMutation({
    mutationFn: (entryId: string) => api.markLeft(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient marque parti" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    enabled: canReassign,
  });

  const reassignMutation = useMutation({
    mutationFn: ({
      entryId,
      doctorId,
    }: {
      entryId: string;
      doctorId: string;
    }) => api.reassignPatient(entryId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient reassigne" });
      setReassignEntry(null);
      setSelectedDoctorId("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => api.getPaymentMethods(),
    enabled: !!paymentEntry,
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      api.createPaiement({
        patient_id: paymentEntry!.patient_id!,
        montant: parseFloat(paymentAmount),
        type: "encaissement" as PaiementType,
        mode_paiement: paymentMode || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      toast({ title: "Paiement enregistre" });
      setPaymentEntry(null);
      setPaymentAmount("");
      setPaymentMode("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const allUsers = usersData?.users || [];
  const doctors = allUsers.filter(
    (u: { role_nom?: string | null }) => u.role_nom === "Praticien"
  );

  const entries: QueueEntry[] = queueData?.entries || [];

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
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-2">Salle d'attente</h1>
            {newCheckIns > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {newCheckIns} nouveau{newCheckIns > 1 ? "x" : ""}
              </Badge>
            )}
          </div>
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
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
              style={autoRefresh ? { animationDuration: "3s" } : {}}
            />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["queue"] });
              resetCount();
            }}
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
            <p className="text-3xl font-bold text-amber-600">
              {inTreatmentCount}
            </p>
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-6 w-40 skeleton rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
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
            const doctorEntries = groupedByDoctor[doctorName] ?? [];
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
                      const statusConf = (
                        queueStatusConfig[entry.status] ??
                        queueStatusConfig.waiting
                      )!;
                      const isWaiting =
                        entry.status === "waiting" ||
                        entry.status === "checked_in";
                      const isInTreatment =
                        entry.status === "in_treatment" ||
                        entry.status === "called";

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                            isInTreatment
                              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                              : ""
                          }`}
                        >
                          {/* Position */}
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                              isWaiting
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                : isInTreatment
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            }`}
                          >
                            {entry.position ?? index + 1}
                          </div>

                          {/* Patient info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {getPatientDisplayName(entry)}
                              </p>
                              {entry.patient_code_carte && (
                                <Badge variant="outline" size="sm" className="shrink-0 text-[10px] px-1.5">
                                  {entry.patient_code_carte}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {entry.heure || entry.time || ""}
                              {entry.checked_in_at &&
                                ` - Arrive a ${new Date(entry.checked_in_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                              {entry.patient_telephone && ` · ${entry.patient_telephone}`}
                            </p>
                            {entry.zone_names && entry.zone_names.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.zone_names.map((zone) => (
                                  <Badge key={zone} variant="secondary" size="sm" className="text-[10px] px-1.5 py-0">
                                    {zone}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Box */}
                          {entry.box_nom &&
                            (isInTreatment || entry.status === "called") && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 gap-1"
                              >
                                <DoorOpen className="h-3 w-3" />
                                {entry.box_nom}
                              </Badge>
                            )}

                          {/* Status */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={statusConf.variant}
                              dot
                              className={
                                statusConf.pulse ? "animate-pulse" : ""
                              }
                            >
                              {statusConf.label}
                            </Badge>
                          </div>

                          {/* Actions */}
                          {hasPermission("queue.manage") && (
                          <div className="flex gap-1 shrink-0">
                            {canReassign && isWaiting && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setReassignEntry(entry);
                                  setSelectedDoctorId(
                                    entry.doctor_id || ""
                                  );
                                }}
                                title="Reassigner"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            )}
                            {isWaiting && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => callMutation.mutate(entry)}
                                  disabled={callMutation.isPending}
                                  title="Appeler le patient"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Appeler
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() =>
                                    noShowMutation.mutate(entry.id)
                                  }
                                  disabled={noShowMutation.isPending}
                                  title="Marquer absent"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {isInTreatment && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => leftMutation.mutate(entry.id)}
                                disabled={leftMutation.isPending}
                                title="Patient parti"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                Parti
                              </Button>
                            )}
                            {(entry.status === "done" || entry.status === "completed" || entry.status === "left") && entry.patient_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPaymentEntry(entry);
                                  setPaymentAmount("");
                                  setPaymentMode("");
                                }}
                                className="text-green-700 border-green-300 hover:bg-green-50"
                              >
                                <Banknote className="h-4 w-4 mr-1" />
                                Paiement
                              </Button>
                            )}
                          </div>
                          )}
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
                Aucun patient en attente pour le moment. Les patients
                apparaitront ici apres leur check-in.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reassign dialog */}
      <Dialog
        open={!!reassignEntry}
        onOpenChange={(open) => {
          if (!open) setReassignEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reassigner{" "}
              {reassignEntry ? getPatientDisplayName(reassignEntry) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choisir un medecin :
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {doctors.map(
                (doc: { id: string; prenom?: string; nom?: string }) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selectedDoctorId === doc.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">
                      Dr. {doc.prenom} {doc.nom}
                    </span>
                    {selectedDoctorId === doc.id && (
                      <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </button>
                )
              )}
              {doctors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun praticien disponible
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignEntry(null)}>
              Annuler
            </Button>
            <Button
              disabled={!selectedDoctorId || reassignMutation.isPending}
              onClick={() => {
                if (reassignEntry && selectedDoctorId) {
                  reassignMutation.mutate({
                    entryId: reassignEntry.id,
                    doctorId: selectedDoctorId,
                  });
                }
              }}
            >
              {reassignMutation.isPending ? "Reassignation..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog
        open={!!paymentEntry}
        onOpenChange={(open) => {
          if (!open) setPaymentEntry(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Paiement - {paymentEntry ? getPatientDisplayName(paymentEntry) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Montant (DA) *</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ex: 5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <div className="flex flex-wrap gap-2">
                {(paymentMethods ?? [])
                  .filter((m) => m.is_active)
                  .sort((a, b) => a.ordre - b.ordre)
                  .map((method) => (
                    <Button
                      key={method.id}
                      type="button"
                      variant={paymentMode === method.nom ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setPaymentMode(paymentMode === method.nom ? "" : method.nom)
                      }
                    >
                      {method.nom}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentEntry(null)}>
              Annuler
            </Button>
            <Button
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                paymentMutation.isPending
              }
              onClick={() => paymentMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
            >
              {paymentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
