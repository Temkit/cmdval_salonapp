import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Upload,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  RefreshCw,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { PatientConflictDialog } from "@/components/patient-conflict-dialog";
import type { CheckInConflictResponse } from "@/types";

export const Route = createFileRoute("/secretary/agenda")({
  component: SecretaryAgendaPage,
});

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "muted" | "info" | "warning" | "success" | "destructive";
  }
> = {
  expected: { label: "Attendu", variant: "muted" },
  checked_in: { label: "Arrive", variant: "info" },
  in_treatment: { label: "En traitement", variant: "warning" },
  completed: { label: "Termine", variant: "success" },
  no_show: { label: "Absent", variant: "destructive" },
};

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function SecretaryAgendaPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [conflict, setConflict] = useState<CheckInConflictResponse | null>(null);
  const [addForm, setAddForm] = useState({
    patient_prenom: "",
    patient_nom: "",
    doctor_name: "",
    start_time: "",
    duration_type: "",
    notes: "",
  });

  const dateStr = formatDateForApi(selectedDate);
  const isToday = dateStr === formatDateForApi(new Date());

  const {
    data: scheduleData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["schedule", dateStr],
    queryFn: () => (isToday ? api.getTodaySchedule() : api.getSchedule(dateStr)),
  });

  const checkInMutation = useMutation({
    mutationFn: (entryId: string) => api.checkInPatient(entryId),
    onSuccess: (result) => {
      // Check if this is a conflict response
      if ("conflict" in result && result.conflict) {
        setConflict(result as CheckInConflictResponse);
      } else {
        queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
        toast({ title: "Patient enregistre" });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: (data: typeof addForm) =>
      api.createManualScheduleEntry({
        date: dateStr,
        patient_prenom: data.patient_prenom,
        patient_nom: data.patient_nom,
        doctor_name: data.doctor_name,
        start_time: data.start_time,
        duration_type: data.duration_type || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
      toast({ title: "Rendez-vous ajoute" });
      setAddDialogOpen(false);
      setAddForm({
        patient_prenom: "",
        patient_nom: "",
        doctor_name: "",
        start_time: "",
        duration_type: "",
        notes: "",
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(new Date(val + "T00:00:00"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadSchedule(file);
      toast({
        title: "Planning importe",
        description: `${result.entries_created} entree(s) creee(s) pour le ${result.date}`,
      });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Erreur d'import",
        description: error.message,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const entries = scheduleData?.entries || [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateDisplay(selectedDate)}
            {scheduleData?.total !== undefined &&
              ` - ${scheduleData.total} rendez-vous`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Import en cours..." : "Importer"}
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Date picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateStr}
              onChange={handleDateChange}
              className="max-w-[200px]"
            />
            {!isToday && (
              <Button variant="outline" size="sm" onClick={handleGoToToday}>
                Aujourd'hui
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["schedule", dateStr],
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {isError && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message ||
                "Impossible de charger l'agenda"}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Reessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Planning du jour</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="h-5 w-14 skeleton rounded" />
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-5 w-24 skeleton rounded" />
                  <div className="flex-1" />
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Heure
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Patient
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Medecin
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                      Specialite
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const status =
                      statusConfig[entry.status] ?? { label: "Attendu", variant: "muted" as const };
                    return (
                      <tr
                        key={entry.id}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {entry.start_time || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {entry.patient_prenom || entry.patient_nom
                                ? `${entry.patient_prenom || ""} ${entry.patient_nom || ""}`.trim()
                                : "Patient inconnu"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {entry.doctor_name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {entry.specialite || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {entry.duration_type || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={status.variant} dot>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {entry.status === "expected" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                checkInMutation.mutate(entry.id)
                              }
                              disabled={checkInMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Check-in
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucun rendez-vous"
              description="Aucun rendez-vous programme pour cette date"
              action={{
                label: "Importer un planning",
                onClick: () => fileInputRef.current?.click(),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add manual entry dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un rendez-vous</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addEntryMutation.mutate(addForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input
                  required
                  value={addForm.patient_prenom}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      patient_prenom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  value={addForm.patient_nom}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, patient_nom: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medecin</Label>
                <Input
                  required
                  value={addForm.doctor_name}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      doctor_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Heure debut</Label>
                <Input
                  type="time"
                  required
                  value={addForm.start_time}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, start_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type de duree</Label>
              <Input
                placeholder="Ex: 30min, 1h..."
                value={addForm.duration_type}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    duration_type: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Notes optionnelles"
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Patient conflict resolution dialog */}
      <PatientConflictDialog
        conflict={conflict}
        onClose={() => setConflict(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
        }}
      />
    </div>
  );
}
