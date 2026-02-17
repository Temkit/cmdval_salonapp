import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Download,
  QrCode,
  MapPin,
  FileText,
  Clock,
  Upload,
  Image,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate, calculateAge } from "@/lib/utils";
import type { PatientZone } from "@/types";

export const Route = createFileRoute("/secretary/patients/$id")({
  component: SecretaryPatientDetailPage,
});

function SecretaryPatientDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  // Zone dialogs
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editZone, setEditZone] = useState<PatientZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<PatientZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ zone_definition_id: "", seances_prevues: "6" });
  const [editSeances, setEditSeances] = useState("");

  // Subscription dialog
  const [subOpen, setSubOpen] = useState(false);
  const [subForm, setSubForm] = useState({ type: "seance" as string, pack_id: "", montant_paye: "", payFull: false, mode_paiement: "especes" as string });

  // Payment dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payForm, setPayForm] = useState({ montant: "", mode_paiement: "especes" as string, notes: "", subscription_id: "" });

  // Edit patient dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    sexe: "" as string,
    telephone: "",
    email: "",
    adresse: "",
    commune: "",
    wilaya: "",
    notes: "",
    phototype: "" as string,
  });

  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(id),
  });

  const { data: alertsData } = useQuery({
    queryKey: ["patient-alerts", id],
    queryFn: () => api.getPatientAlerts(id),
    enabled: !!patient,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["patient-sessions", id],
    queryFn: () => api.getPatientSessions(id, { page: 1, size: 20 }),
  });

  const { data: paiementsData } = useQuery({
    queryKey: ["patient-paiements", id],
    queryFn: () => api.getPatientPaiements(id),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ["patient-subscriptions", id],
    queryFn: () => api.getPatientSubscriptions(id),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const { data: packsData } = useQuery({
    queryKey: ["packs"],
    queryFn: () => api.getPacks(),
  });

  const { data: paymentMethodsData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => api.getPaymentMethods(),
  });
  const activePaymentMethods = (paymentMethodsData ?? []).filter((m) => m.is_active);

  const { data: absencesData } = useQuery({
    queryKey: ["patient-absences", id],
    queryFn: () => api.getAbsences({ patient_id: id }),
  });

  const { data: docsData } = useQuery({
    queryKey: ["patient-documents", id],
    queryFn: () => api.getPatientDocuments(id),
  });

  const { data: preConsultation } = useQuery({
    queryKey: ["patient-preconsultation", id],
    queryFn: () => api.getPatientPreConsultation(id),
    enabled: !!patient,
  });

  const addZoneMutation = useMutation({
    mutationFn: () => api.addPatientZone(id, {
      zone_definition_id: zoneForm.zone_definition_id,
      seances_prevues: parseInt(zoneForm.seances_prevues) || 6,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast({ title: "Zone ajoutee" });
      setAddZoneOpen(false);
      setZoneForm({ zone_definition_id: "", seances_prevues: "6" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const updateZoneMutation = useMutation({
    mutationFn: () => api.updatePatientZone(id, editZone!.id, { seances_prevues: parseInt(editSeances) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast({ title: "Zone mise a jour" });
      setEditZone(null);
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: () => api.deletePatientZone(id, deleteZone!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast({ title: "Zone supprimee" });
      setDeleteZone(null);
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const selectedPack = (packsData?.packs ?? []).find((p) => p.id === subForm.pack_id);
  const createSubMutation = useMutation({
    mutationFn: async () => {
      const montant = subForm.payFull && selectedPack ? selectedPack.prix : parseFloat(subForm.montant_paye) || 0;
      const sub = await api.createSubscription(id, {
        type: subForm.type as "gold" | "pack" | "seance",
        pack_id: subForm.pack_id || null,
        montant_paye: montant,
      });
      // Create payment record when paying full pack
      if (subForm.payFull && montant > 0) {
        await api.createPaiement({
          patient_id: id,
          subscription_id: sub.id,
          montant,
          type: "encaissement",
          mode_paiement: subForm.mode_paiement as "especes" | "carte" | "virement",
          notes: `Paiement complet pack ${selectedPack?.nom || ""}`,
        });
      }
      return sub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-paiements", id] });
      toast({ title: subForm.payFull ? "Abonnement cree et paiement enregistre" : "Abonnement cree" });
      setSubOpen(false);
      setSubForm({ type: "seance", pack_id: "", montant_paye: "", payFull: false, mode_paiement: "especes" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const payMutation = useMutation({
    mutationFn: () => api.createPaiement({
      patient_id: id,
      subscription_id: payForm.subscription_id || null,
      montant: parseFloat(payForm.montant) || 0,
      type: "encaissement",
      mode_paiement: payForm.mode_paiement as "especes" | "carte" | "virement",
      notes: payForm.notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-subscriptions", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-paiements", id] });
      toast({ title: "Paiement enregistre" });
      setPayDialogOpen(false);
      setPayForm({ montant: "", mode_paiement: "especes", notes: "", subscription_id: "" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const openEditDialog = () => {
    if (!patient) return;
    setEditForm({
      nom: patient.nom || "",
      prenom: patient.prenom || "",
      date_naissance: patient.date_naissance || "",
      sexe: patient.sexe || "",
      telephone: patient.telephone || "",
      email: patient.email || "",
      adresse: patient.adresse || "",
      commune: patient.commune || "",
      wilaya: patient.wilaya || "",
      notes: patient.notes || "",
      phototype: patient.phototype || "",
    });
    setEditOpen(true);
  };

  const editPatientMutation = useMutation({
    mutationFn: () =>
      api.updatePatient(id, {
        nom: editForm.nom || undefined,
        prenom: editForm.prenom || undefined,
        date_naissance: editForm.date_naissance || undefined,
        sexe: (editForm.sexe as "M" | "F") || undefined,
        telephone: editForm.telephone || undefined,
        email: editForm.email || undefined,
        adresse: editForm.adresse || undefined,
        commune: editForm.commune || undefined,
        wilaya: editForm.wilaya || undefined,
        notes: editForm.notes || undefined,
        phototype: editForm.phototype || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast({ title: "Patient mis a jour" });
      setEditOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => api.uploadPatientDocument(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", id] });
      toast({ title: "Document ajoute" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => api.deletePatientDocument(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", id] });
      toast({ title: "Document supprime" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <div className="h-8 w-32 skeleton rounded" />
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="h-16 w-16 skeleton rounded-xl" /><div className="space-y-2"><div className="h-6 w-48 skeleton rounded" /><div className="h-4 w-32 skeleton rounded" /></div></div></CardContent></Card>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="page-container">
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="font-medium">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || "Patient introuvable"}</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/secretary/patients">Retour aux patients</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const alerts = alertsData?.alerts || [];
  const errorAlerts = alerts.filter((a: { severity: string }) => a.severity === "error");
  const warningAlerts = alerts.filter((a: { severity: string }) => a.severity === "warning");
  const existingZoneIds = new Set(patient.zones?.map((z) => z.zone_definition_id) ?? []);
  const availableZones = (zonesData?.zones ?? []).filter((z) => !existingZoneIds.has(z.id));

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/secretary/patients"><ArrowLeft className="h-4 w-4 mr-2" />Patients</Link></Button>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className={errorAlerts.length > 0 ? "border-destructive/50 bg-destructive/5" : "border-amber-300/50 bg-amber-50 dark:bg-amber-950/10"}>
          <CardContent className="p-4">
            <button onClick={() => setAlertsExpanded(!alertsExpanded)} className="flex items-center gap-2 w-full text-left">
              <AlertTriangle className={`h-4 w-4 ${errorAlerts.length > 0 ? "text-destructive" : "text-amber-600"}`} />
              <span className="text-sm font-medium flex-1">
                {errorAlerts.length > 0 && `${errorAlerts.length} alerte${errorAlerts.length > 1 ? "s" : ""}`}
                {errorAlerts.length > 0 && warningAlerts.length > 0 && ", "}
                {warningAlerts.length > 0 && `${warningAlerts.length} avertissement${warningAlerts.length > 1 ? "s" : ""}`}
              </span>
              {alertsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {alertsExpanded && (
              <div className="mt-3 space-y-2">
                {alerts.map((alert: { message: string; severity: string }, i: number) => (
                  <p key={i} className={`text-sm ${alert.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-400"}`}>{alert.message}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">{patient.prenom?.[0]}{patient.nom?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">{patient.prenom} {patient.nom}</h1>
                <Button variant="ghost" size="icon-sm" onClick={openEditDialog}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={patient.status === "actif" ? "success" : patient.status === "ineligible" ? "destructive" : "warning"}>
                  {patient.status === "actif" ? "Actif" : patient.status === "ineligible" ? "Ineligible" : "En attente"}
                </Badge>
                {patient.date_naissance && <Badge variant="secondary">{calculateAge(patient.date_naissance)} ans</Badge>}
                {patient.sexe && <Badge variant="outline">{patient.sexe === "F" ? "Femme" : "Homme"}</Badge>}
                {patient.phototype && <Badge variant="outline">Phototype {patient.phototype}</Badge>}
                {patient.code_carte && <Badge variant="outline" className="gap-1"><CreditCard className="h-3 w-3" />{patient.code_carte}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview">Apercu</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="sessions">Seances</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="absences">
            Absences
            {absencesData && absencesData.total > 0 && (
              <Badge variant="destructive" size="sm" className="ml-1.5">{absencesData.total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Coordonnees</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.telephone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.telephone}</span></div>}
                {patient.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.email}</span></div>}
                {patient.date_naissance && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{formatDate(patient.date_naissance)}</span></div>}
                {patient.adresse && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.adresse}</span></div>}
                {(patient.commune || patient.wilaya) && <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{[patient.commune, patient.wilaya].filter(Boolean).join(", ")}</span></div>}
                {patient.created_at && <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Inscrit le {formatDate(patient.created_at)}</span></div>}
                {!patient.telephone && !patient.email && !patient.date_naissance && !patient.adresse && <p className="text-sm text-muted-foreground">Aucune coordonnee renseignee</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Informations medicales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.phototype && <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Phototype {patient.phototype}</span></div>}
                {patient.sexe && <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.sexe === "F" ? "Femme" : "Homme"}</span></div>}
                {patient.notes && <div><p className="text-xs font-medium text-muted-foreground mb-1">Notes</p><p className="text-sm">{patient.notes}</p></div>}
                {preConsultation && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Pre-consultation</span>
                    </div>
                    <Link to="/secretary/pre-consultations/$id" params={{ id: preConsultation.id }}>
                      <Badge variant={preConsultation.status === "validated" ? "success" : preConsultation.status === "rejected" ? "destructive" : "warning"} className="cursor-pointer">
                        {preConsultation.status === "validated" ? "Validee" : preConsultation.status === "rejected" ? "Rejetee" : preConsultation.status === "pending_validation" ? "En attente" : "Brouillon"}
                      </Badge>
                    </Link>
                  </div>
                )}
                {!patient.phototype && !patient.sexe && !patient.notes && !preConsultation && <p className="text-sm text-muted-foreground">Aucune information medicale</p>}
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Abonnements</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setSubOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subscriptionsData?.subscriptions?.length ? (
                  <div className="space-y-2">
                    {subscriptionsData.subscriptions.map((sub) => {
                      const remaining = sub.pack_prix ? sub.pack_prix - sub.montant_paye : 0;
                      const isPaid = sub.pack_prix ? sub.montant_paye >= sub.pack_prix : false;
                      const payProgress = sub.pack_prix ? Math.min(100, Math.round((sub.montant_paye / sub.pack_prix) * 100)) : 0;
                      return (
                        <div key={sub.id} className="p-3 border rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{sub.pack_nom || sub.type}</span>
                              <Badge variant={sub.is_active ? "success" : "muted"} size="sm">{sub.type}</Badge>
                              {isPaid && <Badge variant="success" size="sm">Paye</Badge>}
                            </div>
                            {sub.pack_prix && !isPaid ? (
                              <Button size="sm" variant="outline" onClick={() => {
                                setPayForm({ montant: String(remaining), mode_paiement: "especes", notes: `Paiement pack ${sub.pack_nom || sub.type}`, subscription_id: sub.id });
                                setPayDialogOpen(true);
                              }}>
                                <CreditCard className="h-3.5 w-3.5 mr-1" />Payer le pack
                              </Button>
                            ) : (
                              <span className="text-sm font-medium">{sub.montant_paye} DA</span>
                            )}
                          </div>
                          {sub.pack_prix && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Paye: <strong className="text-foreground">{sub.montant_paye} DA</strong> / {sub.pack_prix} DA</span>
                                {remaining > 0 && <span>reste {remaining} DA</span>}
                              </div>
                              <Progress value={payProgress} />
                            </div>
                          )}
                          {sub.date_debut && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(sub.date_debut)}{sub.date_fin && ` - ${formatDate(sub.date_fin)}`}
                              {sub.days_remaining != null && sub.days_remaining > 0 && ` (${sub.days_remaining}j restants)`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">Aucun abonnement</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Zones ({patient.zones?.length || 0})</CardTitle>
                {availableZones.length > 0 && (
                  <Button size="sm" onClick={() => setAddZoneOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Ajouter une zone
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {patient.zones && patient.zones.length > 0 ? (
                <div className="space-y-3">
                  {patient.zones.map((zone) => {
                    const progress = zone.seances_prevues > 0 ? Math.round((zone.seances_effectuees / zone.seances_prevues) * 100) : 0;
                    return (
                      <div key={zone.id} className="p-4 border rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{zone.zone_nom}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{zone.seances_effectuees}/{zone.seances_prevues} seances</span>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditZone(zone); setEditSeances(zone.seances_prevues.toString()); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteZone(zone)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={progress} />
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-center py-8"><p className="text-sm text-muted-foreground">Aucune zone configuree</p></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardContent className="p-6">
              {sessionsData?.sessions?.length ? (
                <div className="space-y-3">
                  {sessionsData.sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-4 border rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{session.zone_nom || "Zone"}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.date_seance && formatDate(session.date_seance)}
                          {session.praticien_nom && ` - Dr. ${session.praticien_nom}`}
                        </p>
                      </div>
                      {session.type_laser && <Badge variant="outline">{session.type_laser}</Badge>}
                      {session.duree_minutes && <span className="text-sm text-muted-foreground">{session.duree_minutes} min</span>}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8"><p className="text-sm text-muted-foreground">Aucune seance enregistree</p></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-6">
              {paiementsData?.paiements?.length ? (
                <div className="space-y-3">
                  {paiementsData.paiements.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 border rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{p.montant ? `${p.montant} DA` : "-"}</p>
                        <p className="text-xs text-muted-foreground">{p.date_paiement && formatDate(p.date_paiement)}{p.reference && ` - Ref: ${p.reference}`}</p>
                      </div>
                      {p.type && <Badge variant="secondary">{p.type}</Badge>}
                      {p.mode_paiement && <Badge variant="outline">{p.mode_paiement}</Badge>}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8"><p className="text-sm text-muted-foreground">Aucun paiement enregistre</p></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Documents generes</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a href={api.getPatientConsentUrl(id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <Download className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-medium">Consentement</p><p className="text-xs text-muted-foreground">Formulaire de consentement</p></div>
                  </a>
                  <a href={api.getPatientRulesUrl(id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <Download className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-medium">Reglement</p><p className="text-xs text-muted-foreground">Reglement interieur</p></div>
                  </a>
                  <a href={api.getPatientPrecautionsUrl(id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <Download className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-medium">Precautions</p><p className="text-xs text-muted-foreground">Precautions post-traitement</p></div>
                  </a>
                  <a href={api.getPatientQRCodeUrl(id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div><p className="text-sm font-medium">QR Code</p><p className="text-xs text-muted-foreground">Code QR du patient</p></div>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Feuilles de passage / Scans</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*,.pdf";
                      input.multiple = true;
                      input.onchange = () => {
                        if (input.files) {
                          Array.from(input.files).forEach((f) => uploadDocMutation.mutate(f));
                        }
                      };
                      input.click();
                    }}
                    disabled={uploadDocMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    {uploadDocMutation.isPending ? "Envoi..." : "Ajouter"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {docsData && docsData.documents.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {docsData.documents.map((doc) => (
                      <div key={doc.id} className="group relative border rounded-xl overflow-hidden">
                        {doc.content_type.startsWith("image/") ? (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={doc.url}
                              alt={doc.filename}
                              className="w-full h-40 object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-40 bg-muted/30"
                          >
                            <FileText className="h-10 w-10 text-muted-foreground" />
                          </a>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{doc.filename}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(doc.created_at)} - {(doc.size_bytes / 1024).toFixed(0)} Ko
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteDocMutation.mutate(doc.id)}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun document televerse</p>
                    <p className="text-xs text-muted-foreground mt-1">Ajoutez des photos ou scans des anciennes feuilles de passage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="absences">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Historique des absences</CardTitle></CardHeader>
            <CardContent>
              {absencesData && absencesData.absences.length > 0 ? (
                <div className="space-y-3">
                  {absencesData.absences.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Absent(e)</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(a.date)}
                          </span>
                          {a.doctor_name && (
                            <span className="text-xs text-muted-foreground">Dr. {a.doctor_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune absence enregistree</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Zone Dialog */}
      <Dialog open={addZoneOpen} onOpenChange={setAddZoneOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter une zone</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addZoneMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={zoneForm.zone_definition_id} onValueChange={(v) => setZoneForm((f) => ({ ...f, zone_definition_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une zone" /></SelectTrigger>
                <SelectContent>
                  {availableZones.map((z) => <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seances prevues</Label>
              <Input type="number" min="1" value={zoneForm.seances_prevues} onChange={(e) => setZoneForm((f) => ({ ...f, seances_prevues: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddZoneOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!zoneForm.zone_definition_id || addZoneMutation.isPending}>
                {addZoneMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editZone} onOpenChange={(open) => !open && setEditZone(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier {editZone?.zone_nom}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateZoneMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Seances prevues</Label>
              <Input type="number" min="1" value={editSeances} onChange={(e) => setEditSeances(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditZone(null)}>Annuler</Button>
              <Button type="submit" disabled={updateZoneMutation.isPending}>
                {updateZoneMutation.isPending ? "Mise a jour..." : "Mettre a jour"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Zone Confirm */}
      <ConfirmDialog
        open={!!deleteZone}
        onOpenChange={(open) => !open && setDeleteZone(null)}
        title="Supprimer la zone"
        description={`Etes-vous sur de vouloir supprimer la zone "${deleteZone?.zone_nom}" ?`}
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => deleteZoneMutation.mutate()}
        isLoading={deleteZoneMutation.isPending}
      />

      {/* Add Subscription Dialog */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel abonnement</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSubMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={subForm.type} onValueChange={(v) => setSubForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="seance">Seance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subForm.type === "pack" && (
              <div className="space-y-2">
                <Label>Pack</Label>
                <Select value={subForm.pack_id} onValueChange={(v) => setSubForm((f) => ({ ...f, pack_id: v, payFull: false }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un pack" /></SelectTrigger>
                  <SelectContent>
                    {(packsData?.packs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nom} - {p.prix} DA</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {subForm.type === "pack" && selectedPack && (
              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={subForm.payFull}
                  onChange={(e) => setSubForm((f) => ({
                    ...f,
                    payFull: e.target.checked,
                    montant_paye: e.target.checked ? String(selectedPack.prix) : "",
                  }))}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">Payer le pack en totalite</span>
                  <p className="text-xs text-muted-foreground">{selectedPack.prix} DA</p>
                </div>
              </label>
            )}
            {subForm.payFull ? (
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={subForm.mode_paiement} onValueChange={(v) => setSubForm((f) => ({ ...f, mode_paiement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activePaymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.nom}>{m.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Montant initial (DA)</Label>
                <Input type="number" min="0" value={subForm.montant_paye} onChange={(e) => setSubForm((f) => ({ ...f, montant_paye: e.target.value }))} placeholder="0" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createSubMutation.isPending}>
                {createSubMutation.isPending ? "Creation..." : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pay Pack Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Paiement pack</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); payMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Montant (DA)</Label>
              <Input type="number" min="0" value={payForm.montant} onChange={(e) => setPayForm((f) => ({ ...f, montant: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={payForm.mode_paiement} onValueChange={(v) => setPayForm((f) => ({ ...f, mode_paiement: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activePaymentMethods.map((m) => (
                    <SelectItem key={m.id} value={m.nom}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes optionnelles" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={payMutation.isPending}>
                {payMutation.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editPatientMutation.mutate(); }} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={editForm.nom} onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input value={editForm.prenom} onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input type="date" value={editForm.date_naissance} onChange={(e) => setEditForm((f) => ({ ...f, date_naissance: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={editForm.sexe} onValueChange={(v) => setEditForm((f) => ({ ...f, sexe: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sexe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Homme</SelectItem>
                    <SelectItem value="F">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={editForm.telephone} onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={editForm.adresse} onChange={(e) => setEditForm((f) => ({ ...f, adresse: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commune</Label>
                <Input value={editForm.commune} onChange={(e) => setEditForm((f) => ({ ...f, commune: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Wilaya</Label>
                <Input value={editForm.wilaya} onChange={(e) => setEditForm((f) => ({ ...f, wilaya: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phototype</Label>
              <Select value={editForm.phototype} onValueChange={(v) => setEditForm((f) => ({ ...f, phototype: v }))}>
                <SelectTrigger><SelectValue placeholder="Phototype" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">I</SelectItem>
                  <SelectItem value="II">II</SelectItem>
                  <SelectItem value="III">III</SelectItem>
                  <SelectItem value="IV">IV</SelectItem>
                  <SelectItem value="V">V</SelectItem>
                  <SelectItem value="VI">VI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={editPatientMutation.isPending}>
                {editPatientMutation.isPending ? "Mise a jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
