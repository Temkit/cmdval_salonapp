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

export const Route = createFileRoute("/admin/patients/$id")({
  component: AdminPatientDetailPage,
});

function AdminPatientDetailPage() {
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
  const [subForm, setSubForm] = useState({ type: "seance" as string, pack_id: "", montant_paye: "" });

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

  const createSubMutation = useMutation({
    mutationFn: () => api.createSubscription(id, {
      type: subForm.type as "gold" | "pack" | "seance",
      pack_id: subForm.pack_id || null,
      montant_paye: parseFloat(subForm.montant_paye) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-subscriptions", id] });
      toast({ title: "Abonnement cree" });
      setSubOpen(false);
      setSubForm({ type: "seance", pack_id: "", montant_paye: "" });
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
          <Button asChild variant="outline" className="mt-4"><Link to="/admin/patients">Retour aux patients</Link></Button>
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
      <Button asChild variant="ghost" size="sm"><Link to="/admin/patients"><ArrowLeft className="h-4 w-4 mr-2" />Patients</Link></Button>

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
              <h1 className="text-xl font-bold truncate">{patient.prenom} {patient.nom}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {patient.date_naissance && <Badge variant="secondary">{calculateAge(patient.date_naissance)} ans</Badge>}
                {patient.sexe && <Badge variant="outline">{patient.sexe}</Badge>}
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
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Coordonnees</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.telephone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.telephone}</span></div>}
                {patient.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.email}</span></div>}
                {patient.date_naissance && <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{formatDate(patient.date_naissance)}</span></div>}
                {!patient.telephone && !patient.email && !patient.date_naissance && <p className="text-sm text-muted-foreground">Aucune coordonnee renseignee</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Informations medicales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patient.phototype && <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Phototype {patient.phototype}</span></div>}
                {patient.sexe && <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{patient.sexe}</span></div>}
                {patient.notes && <p className="text-sm text-muted-foreground">{patient.notes}</p>}
                {!patient.phototype && !patient.sexe && !patient.notes && <p className="text-sm text-muted-foreground">Aucune information medicale</p>}
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
                    {subscriptionsData.subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{sub.pack_nom || sub.type}</span>
                            <Badge variant={sub.is_active ? "success" : "muted"} size="sm">{sub.type}</Badge>
                          </div>
                          {sub.date_debut && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(sub.date_debut)}{sub.date_fin && ` - ${formatDate(sub.date_fin)}`}
                              {sub.days_remaining != null && sub.days_remaining > 0 && ` (${sub.days_remaining}j restants)`}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium">{sub.montant_paye} DA</span>
                      </div>
                    ))}
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
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Documents</CardTitle></CardHeader>
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
                <Select value={subForm.pack_id} onValueChange={(v) => setSubForm((f) => ({ ...f, pack_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un pack" /></SelectTrigger>
                  <SelectContent>
                    {(packsData?.packs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nom} - {p.prix} DA</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Montant (DA)</Label>
              <Input type="number" min="0" value={subForm.montant_paye} onChange={(e) => setSubForm((f) => ({ ...f, montant_paye: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createSubMutation.isPending}>
                {createSubMutation.isPending ? "Creation..." : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
