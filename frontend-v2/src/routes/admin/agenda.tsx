import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useMemo, useCallback } from "react";
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
  Check,
  XCircle,
  Search,
  Pencil,
  Trash2,
  Download,
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
import { useAuthStore } from "@/stores/auth-store";
import type { CheckInConflictResponse, PhoneConflict, Patient, PatientZone } from "@/types";

export const Route = createFileRoute("/admin/agenda")({
  component: AdminAgendaPage,
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

function AdminAgendaPage() {
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [conflict, setConflict] = useState<CheckInConflictResponse | null>(null);
  const [phoneConflicts, setPhoneConflicts] = useState<PhoneConflict[]>([]);
  const [addForm, setAddForm] = useState({
    patient_prenom: "",
    patient_nom: "",
    patient_id: "" as string,
    doctor_id: "",
    start_time: "",
    selected_zone_ids: [] as string[],
    notes: "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [patientZones, setPatientZones] = useState<PatientZone[]>([]);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorResults, setShowDoctorResults] = useState(false);
  const [doctorMode, setDoctorMode] = useState<"select" | "create">("select");
  const [newDoctorForm, setNewDoctorForm] = useState({ prenom: "", nom: "", username: "", password: "" });
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    doctor_id: "",
    doctor_name: "",
    start_time: "",
    end_time: "",
    duration_type: "",
    selected_zone_ids: [] as string[],
    notes: "",
  });

  const dateStr = formatDateForApi(selectedDate);
  const isToday = dateStr === formatDateForApi(new Date());

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.getRoles(),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const doctors = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users.filter(
      (u) =>
        u.actif &&
        u.role_nom &&
        /praticien|medecin|médecin/i.test(u.role_nom),
    );
  }, [usersData]);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors;
    const q = doctorSearch.toLowerCase();
    return doctors.filter(
      (d) => `${d.prenom} ${d.nom}`.toLowerCase().includes(q)
    );
  }, [doctors, doctorSearch]);

  const zones = useMemo(() => {
    if (!zonesData?.zones) return [];
    return zonesData.zones.filter((z) => z.is_active);
  }, [zonesData]);

  const totalMinutes = useMemo(() => {
    return zones
      .filter((z) => addForm.selected_zone_ids.includes(z.id))
      .reduce((sum, z) => sum + (z.duree_minutes || 0), 0);
  }, [zones, addForm.selected_zone_ids]);

  const toggleZone = (zoneId: string) => {
    setAddForm((f) => ({
      ...f,
      selected_zone_ids: f.selected_zone_ids.includes(zoneId)
        ? f.selected_zone_ids.filter((id) => id !== zoneId)
        : [...f.selected_zone_ids, zoneId],
    }));
  };

  const handlePatientSearch = useCallback((query: string) => {
    setPatientSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) {
      setPatientResults([]);
      setShowPatientResults(false);
      return;
    }
    setSearchingPatients(true);
    setShowPatientResults(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await api.getPatients({ q: query, size: 8 });
        setPatientResults(result.patients);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
  }, []);

  const selectPatient = useCallback(async (patient: Patient) => {
    setAddForm((f) => ({
      ...f,
      patient_prenom: patient.prenom,
      patient_nom: patient.nom,
      patient_id: patient.id,
    }));
    setPatientSearch(`${patient.prenom} ${patient.nom}`);
    setShowPatientResults(false);
    try {
      const zonesResult = await api.getPatientZones(patient.id);
      setPatientZones(zonesResult.zones);
    } catch {
      setPatientZones([]);
    }
  }, []);

  const clearSelectedPatient = useCallback(() => {
    setAddForm((f) => ({
      ...f,
      patient_prenom: "",
      patient_nom: "",
      patient_id: "",
    }));
    setPatientSearch("");
    setPatientZones([]);
    setPatientResults([]);
  }, []);

  const selectDoctor = useCallback((doctor: (typeof doctors)[0]) => {
    setAddForm((f) => ({ ...f, doctor_id: doctor.id }));
    setDoctorSearch(`${doctor.prenom} ${doctor.nom}`);
    setShowDoctorResults(false);
  }, []);

  const clearSelectedDoctor = useCallback(() => {
    setAddForm((f) => ({ ...f, doctor_id: "" }));
    setDoctorSearch("");
  }, []);

  const handleCreateDoctor = useCallback(async () => {
    const medecinRole = rolesData?.roles.find((r) => /praticien|medecin|médecin/i.test(r.nom));
    if (!medecinRole) {
      toast({ variant: "destructive", title: "Erreur", description: "Role medecin introuvable" });
      return;
    }
    setCreatingDoctor(true);
    try {
      const newUser = await api.createUser({
        prenom: newDoctorForm.prenom,
        nom: newDoctorForm.nom,
        username: newDoctorForm.username,
        password: newDoctorForm.password,
        role_id: medecinRole.id,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setAddForm((f) => ({ ...f, doctor_id: newUser.id }));
      setDoctorSearch(`${newUser.prenom} ${newUser.nom}`);
      setDoctorMode("select");
      setNewDoctorForm({ prenom: "", nom: "", username: "", password: "" });
      toast({ title: "Medecin cree" });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Erreur", description: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setCreatingDoctor(false);
    }
  }, [newDoctorForm, rolesData, queryClient, toast]);

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

  const noShowMutation = useMutation({
    mutationFn: (entryId: string) => api.markScheduleNoShow(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
      queryClient.invalidateQueries({ queryKey: ["absences"] });
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

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => api.deleteScheduleEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
      toast({ title: "Rendez-vous supprime" });
      setDeleteConfirmId(null);
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
    mutationFn: async (data: typeof addForm) => {
      let patientId = data.patient_id || undefined;

      // If "new" mode, create patient first
      if (patientMode === "new" && !patientId) {
        const newPatient = await api.createPatient({
          prenom: data.patient_prenom,
          nom: data.patient_nom,
          telephone: newPatientPhone || undefined,
        });
        patientId = newPatient.id;
      }

      const doctor = doctors.find((u) => u.id === data.doctor_id);
      const selectedZones = zones.filter((z) =>
        data.selected_zone_ids.includes(z.id),
      );
      const minutes = selectedZones.reduce(
        (sum, z) => sum + (z.duree_minutes || 0),
        0,
      );
      const durationStr =
        selectedZones.length > 0
          ? `${selectedZones.map((z) => z.nom).join(", ")} (${minutes}min)`
          : undefined;

      return api.createManualScheduleEntry({
        date: dateStr,
        patient_prenom: data.patient_prenom,
        patient_nom: data.patient_nom,
        patient_id: patientId,
        doctor_id: data.doctor_id || undefined,
        doctor_name: doctor
          ? `${doctor.prenom} ${doctor.nom}`
          : doctorSearch || undefined,
        start_time: data.start_time,
        zone_ids:
          data.selected_zone_ids.length > 0
            ? data.selected_zone_ids
            : undefined,
        duration_type: durationStr,
        notes: data.notes || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
      toast({ title: "Rendez-vous ajoute" });
      if (data?.zone_warnings?.length) {
        toast({
          title: "Avertissement zones",
          description: data.zone_warnings.join(". "),
        });
      }
      setAddDialogOpen(false);
      setAddForm({
        patient_prenom: "",
        patient_nom: "",
        patient_id: "",
        doctor_id: "",
        start_time: "",
        selected_zone_ids: [],
        notes: "",
      });
      setPatientSearch("");
      setPatientZones([]);
      setPatientMode("existing");
      setNewPatientPhone("");
      setDoctorSearch("");
      setDoctorMode("select");
      setNewDoctorForm({ prenom: "", nom: "", username: "", password: "" });
      if (patientMode === "new") {
        queryClient.invalidateQueries({ queryKey: ["patients"] });
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

  const editEntryMutation = useMutation({
    mutationFn: async () => {
      if (!editingEntry) return;
      const doctor = doctors.find((u) => u.id === editForm.doctor_id);
      const selectedZones = zones.filter((z) => editForm.selected_zone_ids.includes(z.id));
      const minutes = selectedZones.reduce((sum, z) => sum + (z.duree_minutes || 0), 0);
      const durationStr = selectedZones.length > 0
        ? `${selectedZones.map((z) => z.nom).join(", ")} (${minutes}min)`
        : editForm.duration_type || undefined;
      return api.updateScheduleEntry(editingEntry.id, {
        doctor_id: editForm.doctor_id || null,
        doctor_name: doctor ? `${doctor.prenom} ${doctor.nom}` : editForm.doctor_name || null,
        zone_ids: editForm.selected_zone_ids.length > 0 ? editForm.selected_zone_ids : null,
        duration_type: durationStr || null,
        start_time: editForm.start_time || null,
        end_time: editForm.end_time || null,
        notes: editForm.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", dateStr] });
      toast({ title: "Rendez-vous modifie" });
      setEditDialogOpen(false);
      setEditingEntry(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const openEditDialog = (entry: any) => {
    setEditingEntry(entry);
    const matchedDoctor = doctors.find((d) => d.id === entry.doctor_id);
    setEditForm({
      doctor_id: entry.doctor_id || "",
      doctor_name: entry.doctor_name || "",
      start_time: entry.start_time || "",
      end_time: entry.end_time || "",
      duration_type: entry.duration_type || "",
      selected_zone_ids: entry.zone_ids || [],
      notes: entry.notes || "",
    });
    setEditDialogOpen(true);
  };

  const editTotalMinutes = useMemo(() => {
    return zones
      .filter((z) => editForm.selected_zone_ids.includes(z.id))
      .reduce((sum, z) => sum + (z.duree_minutes || 0), 0);
  }, [zones, editForm.selected_zone_ids]);

  const toggleEditZone = (zoneId: string) => {
    setEditForm((f) => ({
      ...f,
      selected_zone_ids: f.selected_zone_ids.includes(zoneId)
        ? f.selected_zone_ids.filter((id) => id !== zoneId)
        : [...f.selected_zone_ids, zoneId],
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(new Date(val + "T00:00:00"));
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/v1/schedule/export?target_date=${dateStr}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "agenda_export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export telecharge" });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur export", description: (err as Error).message });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadSchedule(file);
      const parts: string[] = [];
      parts.push(`${result.entries_created} entree(s) creee(s)`);
      if (result.patients_created > 0) parts.push(`${result.patients_created} patient(s) cree(s)`);
      if (result.phone_matched > 0) parts.push(`${result.phone_matched} reliee(s) par telephone`);
      if (result.skipped_rows > 0) parts.push(`${result.skipped_rows} ligne(s) ignoree(s)`);
      toast({ title: "Planning importe", description: parts.join(", ") });
      if (result.phone_conflicts.length > 0) {
        setPhoneConflicts(result.phone_conflicts);
      }
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
        {hasPermission("schedule.manage") && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
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
        )}
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
                          <div className="flex items-center justify-end gap-1">
                            {hasPermission("schedule.manage") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(entry)}
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("schedule.manage") && (
                              deleteConfirmId === entry.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(entry.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteConfirmId(null)}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirmId(entry.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )
                            )}
                            {entry.status === "expected" && hasPermission("schedule.manage") && (
                              <>
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    noShowMutation.mutate(entry.id)
                                  }
                                  disabled={noShowMutation.isPending}
                                  title="Marquer absent"
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
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
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) { setPatientMode("existing"); setNewPatientPhone(""); setDoctorSearch(""); setDoctorMode("select"); setNewDoctorForm({ prenom: "", nom: "", username: "", password: "" }); } }}>
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
            {/* Patient mode tabs */}
            <div className="space-y-3">
              <Label>Patient</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={patientMode === "existing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPatientMode("existing");
                    setAddForm((f) => ({ ...f, patient_prenom: "", patient_nom: "", patient_id: "" }));
                    setNewPatientPhone("");
                  }}
                >
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Patient existant
                </Button>
                <Button
                  type="button"
                  variant={patientMode === "new" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPatientMode("new");
                    clearSelectedPatient();
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nouveau patient
                </Button>
              </div>

              {patientMode === "existing" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom..."
                      value={patientSearch}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      onFocus={() => patientSearch.length >= 2 && setShowPatientResults(true)}
                      className="pl-9"
                    />
                    {addForm.patient_id && (
                      <button
                        type="button"
                        onClick={clearSelectedPatient}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {showPatientResults && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                        {searchingPatients ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">Recherche...</div>
                        ) : patientResults.length > 0 ? (
                          patientResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectPatient(p)}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted text-sm"
                            >
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{p.prenom} {p.nom}</span>
                                {p.telephone && (
                                  <span className="text-muted-foreground ml-2">{p.telephone}</span>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground text-center">Aucun patient trouve</div>
                        )}
                      </div>
                    )}
                  </div>
                  {addForm.patient_id && (
                    <Badge variant="success" className="gap-1">
                      <Check className="h-3 w-3" />
                      {addForm.patient_prenom} {addForm.patient_nom}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Prenom</Label>
                      <Input
                        required
                        placeholder="Prenom"
                        value={addForm.patient_prenom}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, patient_prenom: e.target.value, patient_id: "" }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nom</Label>
                      <Input
                        required
                        placeholder="Nom"
                        value={addForm.patient_nom}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, patient_nom: e.target.value, patient_id: "" }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telephone</Label>
                    <Input
                      placeholder="06 XX XX XX XX"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Doctor creation form - shown above grid when creating */}
            {doctorMode === "create" && (
              <div className="space-y-3 border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nouveau medecin</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDoctorMode("select")}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Prenom" value={newDoctorForm.prenom} onChange={(e) => setNewDoctorForm((f) => ({ ...f, prenom: e.target.value }))} />
                  <Input placeholder="Nom" value={newDoctorForm.nom} onChange={(e) => setNewDoctorForm((f) => ({ ...f, nom: e.target.value }))} />
                </div>
                <Input placeholder="Email" type="email" value={newDoctorForm.username} onChange={(e) => setNewDoctorForm((f) => ({ ...f, username: e.target.value }))} />
                <Input placeholder="Mot de passe" type="password" value={newDoctorForm.password} onChange={(e) => setNewDoctorForm((f) => ({ ...f, password: e.target.value }))} />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={creatingDoctor || !newDoctorForm.prenom || !newDoctorForm.nom || !newDoctorForm.username || !newDoctorForm.password}
                  onClick={handleCreateDoctor}
                >
                  {creatingDoctor ? "Creation..." : "Creer le medecin"}
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medecin</Label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un medecin..."
                    value={doctorSearch}
                    onChange={(e) => {
                      setDoctorSearch(e.target.value);
                      setShowDoctorResults(true);
                      if (addForm.doctor_id) setAddForm((f) => ({ ...f, doctor_id: "" }));
                    }}
                    onFocus={() => setShowDoctorResults(true)}
                    onBlur={() => setTimeout(() => setShowDoctorResults(false), 200)}
                    className="pl-9"
                  />
                  {addForm.doctor_id && (
                    <button
                      type="button"
                      onClick={clearSelectedDoctor}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                  {showDoctorResults && !addForm.doctor_id && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectDoctor(d)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted text-sm"
                          >
                            <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{d.prenom} {d.nom}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground text-center">Aucun medecin trouve</div>
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setDoctorMode("create"); setShowDoctorResults(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted text-sm border-t text-primary"
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="font-medium">Creer un nouveau medecin</span>
                      </button>
                    </div>
                  )}
                </div>
                {addForm.doctor_id && (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    {doctorSearch}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Heure debut</Label>
                <div className="flex items-center gap-1">
                  <select
                    className="flex h-10 w-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={addForm.start_time?.split(":")[0] ?? ""}
                    onChange={(e) => {
                      const mm = addForm.start_time?.split(":")[1] ?? "00";
                      setAddForm((f) => ({ ...f, start_time: `${e.target.value}:${mm}` }));
                    }}
                  >
                    <option value="" disabled>HH</option>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-lg font-bold">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="MM"
                    className="flex h-10 w-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={addForm.start_time?.split(":")[1] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      const num = parseInt(val, 10);
                      const mm = val === "" ? "" : (num > 59 ? "59" : val);
                      const hh = addForm.start_time?.split(":")[0] ?? "08";
                      setAddForm((f) => ({ ...f, start_time: `${hh}:${mm}` }));
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val) {
                        const num = parseInt(val, 10);
                        const mm = num > 59 ? "59" : val.padStart(2, "0");
                        const hh = addForm.start_time?.split(":")[0] ?? "08";
                        setAddForm((f) => ({ ...f, start_time: `${hh}:${mm}` }));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                Zones a traiter
                {addForm.selected_zone_ids.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">
                    ({addForm.selected_zone_ids.length} selectionnee{addForm.selected_zone_ids.length > 1 ? "s" : ""}{totalMinutes > 0 ? `, ${totalMinutes} min` : ""})
                  </span>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {zones.map((zone) => {
                  const isSelected = addForm.selected_zone_ids.includes(
                    zone.id,
                  );
                  const pZone = addForm.patient_id
                    ? patientZones.find((pz) => pz.zone_definition_id === zone.id)
                    : null;
                  const exhausted = pZone && pZone.seances_restantes === 0;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => toggleZone(zone.id)}
                      className={`flex items-center gap-2 text-left text-sm px-3 py-2 rounded-md border transition-colors ${isSelected ? (exhausted ? "bg-destructive text-destructive-foreground border-destructive" : "bg-primary text-primary-foreground border-primary") : "hover:bg-muted"}`}
                    >
                      {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      <span className="truncate">
                        {zone.nom}
                        {zone.duree_minutes != null && (
                          <span className="opacity-70 ml-1">
                            ({zone.duree_minutes}min)
                          </span>
                        )}
                      </span>
                      {exhausted && (
                        <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                      )}
                    </button>
                  );
                })}
              </div>
              {addForm.patient_id && addForm.selected_zone_ids.length > 0 && (() => {
                const warnings = addForm.selected_zone_ids
                  .map((zid) => {
                    const pz = patientZones.find((p) => p.zone_definition_id === zid);
                    if (pz && pz.seances_restantes === 0) return pz.zone_nom;
                    return null;
                  })
                  .filter(Boolean);
                if (warnings.length === 0) return null;
                return (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                      Seances epuisees pour : {warnings.join(", ")}. Le patient n'a plus de seances restantes sur ces zones.
                    </p>
                  </div>
                );
              })()}
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
              <Button
                type="submit"
                disabled={
                  addEntryMutation.isPending ||
                  !addForm.start_time ||
                  (patientMode === "existing" ? !addForm.patient_id : (!addForm.patient_prenom || !addForm.patient_nom))
                }
              >
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

      {/* Phone conflict warning dialog */}
      <Dialog open={phoneConflicts.length > 0} onOpenChange={(open) => !open && setPhoneConflicts([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Conflits de telephone detectes
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Les patients suivants ont ete relies par numero de telephone, mais le nom dans le fichier Excel ne correspond pas exactement au nom enregistre. Veuillez verifier.
          </p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {phoneConflicts.map((c, i) => (
              <div key={i} className="border border-warning/30 bg-warning/5 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Excel: {c.entry_prenom} {c.entry_nom}
                  </span>
                  <Badge variant="warning" size="sm">{c.entry_telephone}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Patient existant: {c.matched_patient_prenom} {c.matched_patient_nom}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setPhoneConflicts([])}>
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit schedule entry dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <form onSubmit={(e) => { e.preventDefault(); editEntryMutation.mutate(); }} className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Patient: <strong>{editingEntry.patient_prenom} {editingEntry.patient_nom}</strong>
              </div>

              <div className="space-y-2">
                <Label>Praticien</Label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={editForm.doctor_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, doctor_id: e.target.value }))}
                >
                  <option value="">Non assigne</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure debut</Label>
                  <Input
                    type="time"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm((f) => ({ ...f, start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <Input
                    type="time"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm((f) => ({ ...f, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zones ({editTotalMinutes > 0 ? `${editTotalMinutes} min` : "aucune"})</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => toggleEditZone(z.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        editForm.selected_zone_ids.includes(z.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {z.nom} ({z.duree_minutes}min)
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={editEntryMutation.isPending}>
                  {editEntryMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
