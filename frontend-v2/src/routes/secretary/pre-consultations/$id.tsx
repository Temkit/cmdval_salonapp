import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/secretary/pre-consultations/$id")({
  component: SecretaryPreConsultationDetail,
});

const STATUS_CONFIG: Record<string, { label: string; variant: "muted" | "warning" | "success" | "destructive"; icon: typeof Clock }> = {
};

function SecretaryPreConsultationDetail() {
  const { id } = Route.useParams();

  const { data: pc, isLoading, isError, error } = useQuery({
    queryKey: ["pre-consultation", id],
    queryFn: () => api.getPreConsultation(id),
  });

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

  const status = STATUS_CONFIG[pc.status] ?? { label: pc.status, variant: "muted" as const, icon: Clock };
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
                {pc.last_laser_date && <p>Derniere seance: {pc.last_laser_date}</p>}
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
            {pc.recent_peeling && (
              <>
                <p>Peeling recent: Oui</p>
                {pc.recent_peeling_date && <p>Date du peeling: {pc.recent_peeling_date}</p>}
                {pc.peeling_zone && <p>Zone du peeling: {pc.peeling_zone}</p>}
              </>
            )}
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

      {/* Patient link */}
      {pc.patient_id && (
        <Card>
          <CardContent className="p-4">
            <Button asChild variant="outline">
              <Link to="/secretary/patients/$id" params={{ id: pc.patient_id }}>
                Voir le patient
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
