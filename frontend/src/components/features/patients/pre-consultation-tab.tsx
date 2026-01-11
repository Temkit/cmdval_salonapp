"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Check,
  X,
  AlertTriangle,
  Baby,
  Stethoscope,
  Zap,
  Scissors,
  Target,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PreConsultation } from "@/types";

interface PreConsultationTabProps {
  patientId: string;
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  celibataire: "Celibataire",
  marie: "Marie(e)",
  divorce: "Divorce(e)",
  veuf: "Veuf/Veuve",
};

const DERMATOLOGICAL_CONDITIONS_LABELS: Record<string, string> = {
  eczema: "Eczema",
  psoriasis: "Psoriasis",
  vitiligo: "Vitiligo",
  acne: "Acne",
  rosacea: "Rosacee",
  melasma: "Melasma",
};

const HAIR_REMOVAL_METHODS_LABELS: Record<string, string> = {
  rasoir: "Rasoir",
  cire: "Cire",
  epilateur: "Epilateur",
  creme: "Creme depilatoire",
  laser: "Laser",
  electrique: "Epilation electrique",
  pince: "Pince a epiler",
};

const MEDICAL_HISTORY_LABELS: Record<string, string> = {
  epilepsy: "Epilepsie",
  sopk: "SOPK",
  hormonal: "Problemes hormonaux",
  diabetes: "Diabete",
  keloid: "Cicatrices cheloides",
  photosensitivity: "Photosensibilite",
};

export function PreConsultationTab({ patientId }: PreConsultationTabProps) {
  const { data: preConsultation, isLoading, error } = useQuery({
    queryKey: ["patient-pre-consultation", patientId],
    queryFn: () => api.getPatientPreConsultation(patientId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preConsultation) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-lg">Pas de pre-consultation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ce patient n'a pas de pre-consultation associee.
              </p>
              <p className="text-sm text-muted-foreground">
                Les seances ne peuvent pas etre effectuees sans pre-consultation validee.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Pre-consultation</p>
                <p className="text-sm text-muted-foreground">
                  Creee le {formatDate(preConsultation.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={preConsultation.status} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pre-consultations/${preConsultation.id}`}>
                  Voir details
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contraindications Section */}
      {preConsultation.has_contraindications && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Contre-indications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {preConsultation.is_pregnant && (
              <div className="flex items-center gap-2 text-orange-600">
                <Baby className="h-4 w-4" />
                <span>Patiente enceinte</span>
              </div>
            )}
            {preConsultation.is_breastfeeding && (
              <div className="flex items-center gap-2 text-orange-600">
                <Baby className="h-4 w-4" />
                <span>Patiente allaitante</span>
              </div>
            )}
            {preConsultation.pregnancy_planning && (
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>Projet de grossesse</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Demographics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informations generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="Sexe" value={preConsultation.sexe === "F" ? "Femme" : "Homme"} />
              <InfoRow label="Age" value={`${preConsultation.age} ans`} />
              {preConsultation.statut_marital && (
                <InfoRow
                  label="Statut marital"
                  value={MARITAL_STATUS_LABELS[preConsultation.statut_marital] || preConsultation.statut_marital}
                />
              )}
              {preConsultation.phototype && (
                <InfoRow label="Phototype" value={`Type ${preConsultation.phototype}`} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previous Laser History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Historique laser
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preConsultation.has_previous_laser ? (
              <div className="space-y-3">
                <InfoRow
                  label="Traitements precedents"
                  value={<Badge variant="secondary">Oui</Badge>}
                />
                {preConsultation.previous_laser_clarity_ii && (
                  <InfoRow label="Clarity II" value={<Badge>Oui</Badge>} />
                )}
                {preConsultation.previous_laser_sessions && (
                  <InfoRow label="Nombre de seances" value={`${preConsultation.previous_laser_sessions}`} />
                )}
                {preConsultation.previous_laser_brand && (
                  <InfoRow label="Marque" value={preConsultation.previous_laser_brand} />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun traitement laser anterieur</p>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Antecedents medicaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(preConsultation.medical_history || {}).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(preConsultation.medical_history || {}).map(([key, value]) => (
                  value && (
                    <Badge key={key} variant="secondary">
                      {MEDICAL_HISTORY_LABELS[key] || key}
                    </Badge>
                  )
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun antecedent signale</p>
            )}

            {/* Dermatological Conditions */}
            {preConsultation.dermatological_conditions && preConsultation.dermatological_conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Conditions dermatologiques</p>
                <div className="flex flex-wrap gap-2">
                  {preConsultation.dermatological_conditions.map((cond) => (
                    <Badge key={cond} variant="outline">
                      {DERMATOLOGICAL_CONDITIONS_LABELS[cond] || cond}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Current Treatments */}
            {preConsultation.has_current_treatments && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Traitements en cours</p>
                <p className="text-sm">{preConsultation.current_treatments_details || "Oui (details non specifies)"}</p>
              </div>
            )}

            {/* Recent Peeling */}
            {preConsultation.recent_peeling && (
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Peeling recent</p>
                <p className="text-sm">
                  {preConsultation.recent_peeling_date
                    ? formatDate(preConsultation.recent_peeling_date)
                    : "Oui"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hair Removal Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Methodes d'epilation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preConsultation.hair_removal_methods && preConsultation.hair_removal_methods.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preConsultation.hair_removal_methods.map((method) => (
                  <Badge key={method} variant="secondary">
                    {HAIR_REMOVAL_METHODS_LABELS[method] || method}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune methode specifiee</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zone Eligibility */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Eligibilite par zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preConsultation.zones && preConsultation.zones.length > 0 ? (
            <div className="space-y-2">
              {preConsultation.zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    zone.is_eligible
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {zone.is_eligible ? (
                      <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <span className="font-medium">{zone.zone_nom}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant={zone.is_eligible ? "success" : "destructive"}>
                      {zone.is_eligible ? "Eligible" : "Non eligible"}
                    </Badge>
                    {zone.observations && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                        {zone.observations}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune zone evaluee
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {preConsultation.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{preConsultation.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Validation Info */}
      {preConsultation.validated_by_name && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Valide par {preConsultation.validated_by_name}
              </span>
              {preConsultation.validated_at && (
                <span className="text-muted-foreground">
                  le {formatDate(preConsultation.validated_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "validated":
      return <Badge variant="success">Validee</Badge>;
    case "patient_created":
      return <Badge variant="success">Patient cree</Badge>;
    case "pending_validation":
      return <Badge variant="warning">En attente</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejetee</Badge>;
    case "draft":
      return <Badge variant="secondary">Brouillon</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}
