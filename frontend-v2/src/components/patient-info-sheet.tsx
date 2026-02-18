import { useQuery } from "@tanstack/react-query";
import { User, Phone, CreditCard, Activity, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface PatientInfoSheetProps {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientInfoSheet({
  patientId,
  open,
  onOpenChange,
}: PatientInfoSheetProps) {
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => api.getPatient(patientId!),
    enabled: !!patientId && open,
  });

  const { data: preConsult } = useQuery({
    queryKey: ["patient-pre-consultation", patientId],
    queryFn: () => api.getPatientPreConsultation(patientId!),
    enabled: !!patientId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Fiche patient
          </DialogTitle>
        </DialogHeader>

        {patientLoading ? (
          <div className="space-y-3">
            <div className="h-6 w-48 skeleton rounded" />
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-4 w-40 skeleton rounded" />
          </div>
        ) : patient ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <h3 className="text-lg font-semibold">
                {patient.prenom} {patient.nom}
              </h3>
              {patient.phototype && (
                <Badge variant="secondary" size="sm" className="mt-1">
                  Phototype {patient.phototype}
                </Badge>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              {patient.code_carte && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{patient.code_carte}</span>
                </div>
              )}
              {patient.telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{patient.telephone}</span>
                </div>
              )}
            </div>

            {/* Zones */}
            {patient.zones && patient.zones.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Zones ({patient.zones.length})
                </p>
                <div className="space-y-1.5">
                  {patient.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-2 border rounded-lg text-sm"
                    >
                      <span className="font-medium">{zone.zone_nom}</span>
                      <Badge variant="outline" size="sm">
                        {zone.seances_effectuees}/{zone.seances_prevues}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pre-consultation summary */}
            {preConsult && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Pre-consultation
                </p>
                <div className="p-2 border rounded-lg text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Statut</span>
                    <Badge
                      variant={
                        preConsult.status === "completed"
                          ? "success"
                          : preConsult.status === "rejected"
                            ? "destructive"
                            : "warning"
                      }
                      size="sm"
                    >
                      {preConsult.status === "completed"
                        ? "Terminee"
                        : preConsult.status === "rejected"
                          ? "Rejetee"
                          : "En cours"}
                    </Badge>
                  </div>
                  {preConsult.has_contraindications && (
                    <p className="text-xs text-destructive">
                      Contre-indications detectees
                    </p>
                  )}
                  {preConsult.phototype && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phototype</span>
                      <span>{preConsult.phototype}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-sm p-2 border rounded-lg bg-muted/50">
                  {patient.notes}
                </p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Patient depuis{" "}
                {new Date(patient.created_at).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Patient non trouve
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
