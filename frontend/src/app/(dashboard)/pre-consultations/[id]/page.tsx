"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  X,
  Clock,
  User,
  FileText,
  Zap,
  XCircle,
  CheckCircle,
  UserPlus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { PreConsultation } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: FileText },
  pending_validation: { label: "En attente de validation", variant: "default", icon: Clock },
  validated: { label: "Validee", variant: "outline", icon: CheckCircle },
  rejected: { label: "Refusee", variant: "destructive", icon: XCircle },
  patient_created: { label: "Patient cree", variant: "outline", icon: UserPlus },
};

export default function PreConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params.id as string;

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCreatePatientDialog, setShowCreatePatientDialog] = useState(false);
  const [patientFormData, setPatientFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    zone_ids: [] as string[],
    seances_per_zone: 6,
  });

  const { data: pc, isLoading } = useQuery({
    queryKey: ["pre-consultation", id],
    queryFn: () => api.getPreConsultation(id),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitPreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      toast({ title: "Pre-consultation soumise pour validation" });
    },
    onError: (error: any) => toast({ variant: "destructive", title: error.message }),
  });

  const validateMutation = useMutation({
    mutationFn: () => api.validatePreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      toast({ title: "Pre-consultation validee" });
    },
    onError: (error: any) => toast({ variant: "destructive", title: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.rejectPreConsultation(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      setShowRejectDialog(false);
      toast({ title: "Pre-consultation refusee" });
    },
    onError: (error: any) => toast({ variant: "destructive", title: error.message }),
  });

  const createPatientMutation = useMutation({
    mutationFn: (data: any) => api.createPatientFromPreConsultation(id, data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultation", id] });
      toast({ title: "Patient cree avec succes" });
      router.push(`/patients/${result.id}`);
    },
    onError: (error: any) => toast({ variant: "destructive", title: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePreConsultation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-consultations"] });
      toast({ title: "Pre-consultation supprimee" });
      router.push("/pre-consultations");
    },
    onError: (error: any) => toast({ variant: "destructive", title: error.message }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 skeleton rounded-xl" />
          <div className="h-8 w-48 skeleton" />
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 skeleton" />
                <div className="h-4 w-32 skeleton" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="h-9 w-24 skeleton rounded-md" />
              <div className="h-9 w-32 skeleton rounded-md" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 skeleton" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!pc) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Pre-consultation non trouvee</p>
        <p className="text-sm text-muted-foreground mt-1">
          Cette pre-consultation n'existe pas ou a ete supprimee
        </p>
        <Button asChild className="mt-4">
          <Link href="/pre-consultations">Retour a la liste</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[pc.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const eligibleZones = pc.zones?.filter((z: any) => z.is_eligible) || [];
  const ineligibleZones = pc.zones?.filter((z: any) => !z.is_eligible) || [];

  const handleCreatePatient = () => {
    createPatientMutation.mutate({
      nom: patientFormData.nom,
      prenom: patientFormData.prenom,
      telephone: patientFormData.telephone,
      email: patientFormData.email,
      zone_ids: patientFormData.zone_ids,
      seances_per_zone: patientFormData.seances_per_zone,
    });
  };

  const toggleZoneSelection = (zoneId: string) => {
    setPatientFormData((prev) => ({
      ...prev,
      zone_ids: prev.zone_ids.includes(zoneId)
        ? prev.zone_ids.filter((id) => id !== zoneId)
        : [...prev.zone_ids, zoneId],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/pre-consultations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="heading-2 truncate">Pre-consultation</h1>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {pc.sexe === "F" ? "Femme" : "Homme"}, {pc.age} ans
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {pc.phototype && (
                  <Badge variant="outline">Type {pc.phototype}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Creee le {formatDate(pc.created_at)}
                {pc.created_by_name && ` par ${pc.created_by_name}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contraindication Alert */}
      {pc.has_contraindications && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive">Contre-indications detectees</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pc.is_pregnant && "Enceinte. "}
              {pc.is_breastfeeding && "Allaitement. "}
              {pc.pregnancy_planning && "Projet de grossesse. "}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {pc.status === "draft" && (
              <>
                <Button asChild>
                  <Link href={`/pre-consultations/${id}/edit`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Modifier
                  </Link>
                </Button>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || pc.zones?.length === 0}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Soumettre pour validation
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </>
            )}

            {pc.status === "pending_validation" && (
              <>
                <Button
                  onClick={() => validateMutation.mutate()}
                  disabled={validateMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Valider
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}

            {pc.status === "validated" && !pc.patient_id && (
              <Button onClick={() => setShowCreatePatientDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Creer le patient
              </Button>
            )}

            {pc.patient_id && (
              <Button asChild variant="outline">
                <Link href={`/patients/${pc.patient_id}`}>
                  <User className="h-4 w-4 mr-2" />
                  Voir le patient
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demographics Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Donnees demographiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
            <span className="text-muted-foreground">Sexe</span>
            <span className="font-medium">{pc.sexe === "F" ? "Femme" : "Homme"}</span>
          </div>
          <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
            <span className="text-muted-foreground">Age</span>
            <span className="font-medium">{pc.age} ans</span>
          </div>
          {pc.phototype && (
            <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Phototype</span>
              <span className="font-medium">{pc.phototype}</span>
            </div>
          )}
          {pc.statut_marital && (
            <div className="flex items-center justify-between p-3 -mx-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Statut marital</span>
              <span className="font-medium">{pc.statut_marital}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Les informations personnelles seront saisies lors de la creation du patient.
          </p>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique medical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pc.has_previous_laser && (
            <div className="p-3 -mx-3 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Traitement laser precedent</p>
              <p className="font-medium">
                {pc.previous_laser_clarity_ii ? "Clarity II" : pc.previous_laser_brand || "Autre"}
                {pc.previous_laser_sessions && ` - ${pc.previous_laser_sessions} seances`}
              </p>
            </div>
          )}

          {pc.hair_removal_methods?.length > 0 && (
            <div className="p-3 -mx-3 rounded-xl border">
              <p className="text-sm text-muted-foreground mb-2">Methodes d'epilation</p>
              <div className="flex flex-wrap gap-1.5">
                {pc.hair_removal_methods.map((method: string) => (
                  <Badge key={method} variant="secondary">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {Object.keys(pc.medical_history || {}).some((k) => pc.medical_history[k]) && (
            <div className="p-3 -mx-3 rounded-xl border">
              <p className="text-sm text-muted-foreground mb-2">Conditions medicales</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(pc.medical_history || {})
                  .filter(([_, v]) => v)
                  .map(([k]) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {pc.has_current_treatments && (
            <div className="p-3 -mx-3 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Traitements en cours</p>
              <p className="font-medium">{pc.current_treatments_details || "Oui"}</p>
            </div>
          )}

          {pc.recent_peeling && (
            <div className="p-3 -mx-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Badge variant="warning">Peeling recent</Badge>
            </div>
          )}

          {!pc.has_previous_laser && !pc.hair_removal_methods?.length &&
           !Object.keys(pc.medical_history || {}).some((k) => pc.medical_history[k]) &&
           !pc.has_current_treatments && !pc.recent_peeling && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun historique medical renseigne
            </p>
          )}
        </CardContent>
      </Card>

      {/* Zone Eligibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Eligibilite des zones ({pc.zones?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eligibleZones.length > 0 && (
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">Zones eligibles</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {eligibleZones.map((zone: any) => (
                  <div key={zone.id} className="p-3 border border-green-500/30 bg-green-50/50 dark:bg-green-950/20 rounded-xl flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-medium">{zone.zone_nom || zone.zone_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ineligibleZones.length > 0 && (
            <div>
              <p className="text-sm font-medium text-destructive mb-2">Zones non eligibles</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ineligibleZones.map((zone: any) => (
                  <div key={zone.id} className="p-3 border border-destructive/30 bg-destructive/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                        <X className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{zone.zone_nom || zone.zone_id}</span>
                        {zone.observations && (
                          <p className="text-sm text-muted-foreground mt-0.5">{zone.observations}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pc.zones?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucune zone evaluee</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {pc.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 -mx-3 rounded-xl border">
              <p className="text-sm whitespace-pre-wrap">{pc.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection reason */}
      {pc.status === "rejected" && pc.rejection_reason && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">Raison du refus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 -mx-3 rounded-xl bg-destructive/10">
              <p className="text-sm">{pc.rejection_reason}</p>
              {pc.validated_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Refuse par {pc.validated_by_name} le {formatDate(pc.validated_at)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <ConfirmDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Refuser la pre-consultation"
        description="Veuillez indiquer la raison du refus."
        confirmLabel="Refuser"
        onConfirm={() => rejectMutation.mutate(rejectReason)}
        isLoading={rejectMutation.isPending}
        variant="danger"
      >
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Raison du refus..."
          rows={3}
        />
      </ConfirmDialog>

      {/* Create Patient Dialog */}
      <ConfirmDialog
        open={showCreatePatientDialog}
        onOpenChange={setShowCreatePatientDialog}
        title="Creer le patient"
        description="Saisissez les informations personnelles du patient et selectionnez les zones a traiter."
        confirmLabel="Creer le patient"
        onConfirm={handleCreatePatient}
        isLoading={createPatientMutation.isPending}
        variant="default"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-sm text-muted-foreground">Prenom *</Label>
              <Input
                value={patientFormData.prenom}
                onChange={(e) => setPatientFormData((p) => ({ ...p, prenom: e.target.value }))}
                placeholder="Prenom du patient"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Nom *</Label>
              <Input
                value={patientFormData.nom}
                onChange={(e) => setPatientFormData((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Nom du patient"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-sm text-muted-foreground">Telephone</Label>
              <Input
                value={patientFormData.telephone}
                onChange={(e) => setPatientFormData((p) => ({ ...p, telephone: e.target.value }))}
                placeholder="Numero de telephone"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                value={patientFormData.email}
                onChange={(e) => setPatientFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="Adresse email"
                className="mt-1"
                type="email"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Zones a traiter (eligibles uniquement)</Label>
            <div className="grid gap-2 mt-2 sm:grid-cols-2">
              {eligibleZones.map((zone: any) => (
                <label
                  key={zone.zone_id}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors",
                    patientFormData.zone_ids.includes(zone.zone_id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={patientFormData.zone_ids.includes(zone.zone_id)}
                    onChange={() => toggleZoneSelection(zone.zone_id)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-medium">{zone.zone_nom || zone.zone_id}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Seances par zone</Label>
            <Input
              type="number"
              value={patientFormData.seances_per_zone}
              onChange={(e) =>
                setPatientFormData((p) => ({
                  ...p,
                  seances_per_zone: parseInt(e.target.value) || 6,
                }))
              }
              min={1}
              max={20}
              className="mt-1 w-32"
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
