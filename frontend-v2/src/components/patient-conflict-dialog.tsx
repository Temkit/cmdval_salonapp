import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, UserPlus, Phone, Mail, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { CheckInConflictResponse } from "@/types";

interface PatientConflictDialogProps {
  conflict: CheckInConflictResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PatientConflictDialog({
  conflict,
  onClose,
  onSuccess,
}: PatientConflictDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [createNew, setCreateNew] = useState(false);
  const [telephone, setTelephone] = useState("");

  const resolveMutation = useMutation({
    mutationFn: (data: { patientId: string | null; telephone?: string }) =>
      api.resolveCheckInConflict({
        schedule_entry_id: conflict!.schedule_entry_id,
        patient_id: data.patientId,
        telephone: data.telephone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast({ title: "Patient enregistre" });
      handleClose();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const handleClose = () => {
    setSelectedPatientId(null);
    setCreateNew(false);
    setTelephone("");
    onClose();
  };

  const handleConfirm = () => {
    if (createNew) {
      resolveMutation.mutate({ patientId: null, telephone: telephone || undefined });
    } else if (selectedPatientId) {
      resolveMutation.mutate({ patientId: selectedPatientId });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!conflict) return null;

  return (
    <Dialog open={!!conflict} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Patient existant detecte</DialogTitle>
          <DialogDescription>
            Un ou plusieurs patients correspondent a{" "}
            <strong>
              {conflict.patient_prenom} {conflict.patient_nom}
            </strong>
            . Selectionnez le patient existant ou creez un nouveau.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing patient options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Patients existants</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflict.candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(candidate.id);
                    setCreateNew(false);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedPatientId === candidate.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {candidate.prenom} {candidate.nom}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        {candidate.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {candidate.telephone}
                          </span>
                        )}
                        {candidate.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {candidate.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Cree le {formatDate(candidate.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* Create new option */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setCreateNew(true);
                setSelectedPatientId(null);
              }}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                createNew
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Creer un nouveau patient</p>
                  <p className="text-sm text-muted-foreground">
                    {conflict.patient_prenom} {conflict.patient_nom} n'existe pas encore
                  </p>
                </div>
              </div>
            </button>

            {createNew && (
              <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                <Label htmlFor="telephone">Telephone (optionnel)</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Vous pourrez completer les informations plus tard
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPatientId && !createNew || resolveMutation.isPending}
          >
            {resolveMutation.isPending ? "Enregistrement..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
