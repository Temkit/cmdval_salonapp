import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Send,
  Trash2,
  Pencil,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/utils";
import { PatientWorkflowStepper, statusToPhase } from "@/components/patient-workflow";

export const Route = createFileRoute("/secretary/pre-consultations/$id")({
  component: SecretaryPreConsultationDetail,
});

const STATUS_CONFIG: Record<string, { label: string; variant: "muted" | "warning" | "success" | "destructive"; icon: typeof Clock }> = {
  draft: { label: "Brouillon", variant: "muted", icon: FileText },
  pending_validation: { label: "En attente de validation", variant: "warning", icon: Clock },
  validated: { label: "Validee", variant: "success", icon: CheckCircle },
  rejected: { label: "Rejetee", variant: "destructive", icon: XCircle },
  patient_created: { label: "Patient cree", variant: "success", icon: UserPlus },
};

function SecretaryPreConsultationDetail() {
  const { id } = Route.useParams();
  const fromWorkflow = new URLSearchParams(window.location.search).get("from") === "nouveau-patient";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const [cpForm, setCpForm] = useState({
    prenom: "", nom: "", telephone: "", email: "",
    zone_ids: [] as string[], seances_per_zone: "6",
  });

  const { data: pc, isLoading, isError, error } = useQuery({
    queryKey: ["pre-consultation", id],
    queryFn: () => api.getPreConsultation(id),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
    enabled: !!pc,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitPreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation soumise" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const validateMutation = useMutation({
    mutationFn: () => api.validatePreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation validee" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.rejectPreConsultation(id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation rejetee" });
      setRejectOpen(false);
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation supprimee" });
      navigate({ to: "/secretary/pre-consultations" });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const createPatientMutation = useMutation({
    mutationFn: () =>
      api.createPatientFromPreConsultation(id, {
        prenom: cpForm.prenom || undefined,
        nom: cpForm.nom || undefined,
        telephone: cpForm.telephone || undefined,
        email: cpForm.email || undefined,
        zone_ids: cpForm.zone_ids.length > 0 ? cpForm.zone_ids : undefined,
        seances_per_zone: parseInt(cpForm.seances_per_zone) || 6,
      }),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Patient cree avec succes" });
      setCreatePatientOpen(false);
      navigate({ to: "/secretary/patients/$id", params: { id: patient.id } });
    },
    onError: (err: Error) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const openCreatePatient = () => {
    if (!pc) return;
    const eligibleZones = pc.zones?.filter((z) => z.is_eligible) ?? [];
    setCpForm({
      prenom: pc.patient_prenom || "",
      nom: pc.patient_nom || "",
      telephone: pc.patient_telephone || "",
      email: "",
      zone_ids: eligibleZones.map((z) => z.zone_id),
      seances_per_zone: "6",
    });
    setCreatePatientOpen(true);
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <div className="h-8 w-32 skeleton rounded" />
        <Card><CardContent className="p-6"><div className="h-32 skeleton rounded" /></CardContent></Card>
      </div>
    );
  }

  if (isError || !pc) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/secretary/pre-consultations">Retour</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = STATUS_CONFIG[pc.status] ?? STATUS_CONFIG.draft!;
  const eligibleZones = pc.zones?.filter((z) => z.is_eligible) ?? [];
  const ineligibleZones = pc.zones?.filter((z) => !z.is_eligible) ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/secretary/pre-consultations"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="heading-2">Pre-consultation</h1>
            <p className="text-sm text-muted-foreground">
              {pc.patient_prenom} {pc.patient_nom}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} dot size="lg">{status.label}</Badge>
      </div>

      {/* Workflow stepper */}
      {fromWorkflow && <PatientWorkflowStepper current={statusToPhase(pc.status)} />}

      {/* Workflow guidance banner */}
      {fromWorkflow && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              {pc.status === "draft" && (
                <>
                  <p className="text-sm font-medium">Etape suivante : soumettre pour validation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verifiez les informations puis cliquez sur « Soumettre » pour envoyer la pre-consultation au responsable.
                  </p>
                </>
              )}
              {pc.status === "pending_validation" && (
                <>
                  <p className="text-sm font-medium">En attente de validation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    La pre-consultation a ete soumise. Un responsable doit la valider avant de pouvoir creer le dossier patient.
                  </p>
                </>
              )}
              {pc.status === "validated" && (
                <>
                  <p className="text-sm font-medium">Pre-consultation validee — creez le dossier patient</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cliquez sur « Creer le patient » pour finaliser l'inscription avec les zones eligibles.
                  </p>
                </>
              )}
              {pc.status === "rejected" && (
                <>
                  <p className="text-sm font-medium">Pre-consultation refusee</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    La pre-consultation a ete refusee. Consultez la raison ci-dessous et creez-en une nouvelle si necessaire.
                  </p>
                </>
              )}
              {pc.status === "patient_created" && (
                <>
                  <p className="text-sm font-medium">Patient cree avec succes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Le dossier patient a ete cree. Vous pouvez maintenant planifier des seances.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              {pc.patient_prenom?.[0]}{pc.patient_nom?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium">{pc.patient_prenom} {pc.patient_nom}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {pc.sexe && <Badge variant="outline" size="sm">{pc.sexe === "F" ? "Femme" : "Homme"}</Badge>}
                {pc.date_naissance && <Badge variant="outline" size="sm">{new Date(pc.date_naissance).toLocaleDateString("fr-FR")} ({pc.age} ans)</Badge>}
                {!pc.date_naissance && pc.age && <Badge variant="outline" size="sm">{pc.age} ans</Badge>}
                {pc.phototype && <Badge variant="outline" size="sm">Phototype {pc.phototype}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contraindication alert */}
      {pc.has_contraindications && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Contre-indications detectees</p>
              <p className="text-xs text-destructive/80 mt-0.5">
                {pc.is_pregnant && "Enceinte "}
                {pc.is_breastfeeding && "Allaitement "}
                {pc.pregnancy_planning && "Projet grossesse"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Demographiques</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Sexe: {pc.sexe === "F" ? "Femme" : "Homme"}</p>
            {pc.date_naissance && <p>Date de naissance: {new Date(pc.date_naissance).toLocaleDateString("fr-FR")}</p>}
            <p>Age: {pc.age} ans</p>
            {pc.phototype && <p>Phototype: {pc.phototype}</p>}
            {pc.statut_marital && <p>Statut marital: {pc.statut_marital}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Historique laser</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{pc.has_previous_laser ? "A deja fait du laser" : "Pas d'historique laser"}</p>
            {pc.has_previous_laser && (
              <>
                {pc.previous_laser_clarity_ii && <p>Clarity II: Oui</p>}
                {pc.previous_laser_sessions && <p>Seances: {pc.previous_laser_sessions}</p>}
                {pc.previous_laser_brand && <p>Marque: {pc.previous_laser_brand}</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Antecedents</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {pc.medical_history && Object.entries(pc.medical_history).filter(([, v]) => v).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {Object.entries(pc.medical_history).filter(([, v]) => v).map(([k]) => (
                  <Badge key={k} variant="secondary" size="sm">{k}</Badge>
                ))}
              </div>
            ) : <p className="text-muted-foreground">Aucun antecedent</p>}
            {pc.dermatological_conditions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {pc.dermatological_conditions.map((c) => (
                  <Badge key={c} variant="outline" size="sm">{c}</Badge>
                ))}
              </div>
            )}
            {pc.has_current_treatments && (
              <p>Traitements: {pc.current_treatments_details || "Oui"}</p>
            )}
            {pc.recent_peeling && <p>Peeling recent: Oui</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodes d'epilation</CardTitle></CardHeader>
          <CardContent>
            {pc.hair_removal_methods?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {pc.hair_removal_methods.map((m) => (
                  <Badge key={m} variant="secondary" size="sm">{m}</Badge>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Non renseigne</p>}
          </CardContent>
        </Card>
      </div>

      {/* Zones */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Zones ineligibles</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ineligibleZones.length > 0 ? (
            <div className="space-y-2">
              {ineligibleZones.map((z) => (
                <div key={z.id} className="p-3 border border-destructive/30 bg-destructive/5 rounded-xl">
                  <Badge variant="destructive" size="sm">{z.zone_nom || z.zone_id}</Badge>
                  {z.observations && (
                    <p className="text-xs text-muted-foreground mt-1.5">{z.observations}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {eligibleZones.length > 0 ? "Aucune zone ineligible" : "Aucune zone evaluee"}
            </p>
          )}
          {eligibleZones.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Zones eligibles</p>
              <div className="flex flex-wrap gap-1.5">
                {eligibleZones.map((z) => (
                  <Badge key={z.id} variant="success" size="sm">{z.zone_nom || z.zone_id}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {pc.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{pc.notes}</p></CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {pc.status === "rejected" && pc.rejection_reason && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">Raison du rejet</p>
            <p className="text-sm mt-1">{pc.rejection_reason}</p>
            {pc.validated_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Rejete le {formatDate(pc.validated_at)}
                {pc.validated_by_name && ` par ${pc.validated_by_name}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {pc.status === "draft" && (
              <>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitMutation.isPending ? "Envoi..." : "Soumettre"}
                </Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}
            {pc.status === "pending_validation" && (
              <>
                <Button onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {validateMutation.isPending ? "Validation..." : "Valider"}
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}
            {pc.status === "validated" && (
              <Button onClick={openCreatePatient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Creer le patient
              </Button>
            )}
            {pc.status === "patient_created" && pc.patient_id && (
              <Button asChild>
                <Link to="/secretary/patients/$id" params={{ id: pc.patient_id }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Voir le patient
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Refuser la pre-consultation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Raison du rejet</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du rejet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Envoi..." : "Refuser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la pre-consultation"
        description="Cette action est irreversible."
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />

      {/* Create Patient Dialog */}
      <Dialog open={createPatientOpen} onOpenChange={setCreatePatientOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Creer le patient</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createPatientMutation.mutate(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Prenom</Label>
                <Input value={cpForm.prenom} onChange={(e) => setCpForm((f) => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nom</Label>
                <Input value={cpForm.nom} onChange={(e) => setCpForm((f) => ({ ...f, nom: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Telephone</Label>
                <Input value={cpForm.telephone} onChange={(e) => setCpForm((f) => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={cpForm.email} onChange={(e) => setCpForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Zones (eligibles uniquement)</Label>
              <div className="flex flex-wrap gap-2">
                {eligibleZones.map((z) => {
                  const selected = cpForm.zone_ids.includes(z.zone_id);
                  return (
                    <Button
                      key={z.id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setCpForm((f) => ({
                          ...f,
                          zone_ids: selected
                            ? f.zone_ids.filter((i) => i !== z.zone_id)
                            : [...f.zone_ids, z.zone_id],
                        }))
                      }
                    >
                      {z.zone_nom || z.zone_id}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seances par zone</Label>
              <Input
                type="number"
                min="1"
                value={cpForm.seances_per_zone}
                onChange={(e) => setCpForm((f) => ({ ...f, seances_per_zone: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreatePatientOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createPatientMutation.isPending}>
                {createPatientMutation.isPending ? "Creation..." : "Creer le patient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
