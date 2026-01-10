"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AddZoneDialogProps {
  patientId: string;
  existingZones: Array<{ zone_definition_id: string }>;
}

const SEANCES_PRESETS = [4, 6, 8, 10, 12];

export function AddZoneDialog({ patientId, existingZones }: AddZoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [seancesPrevues, setSeancesPrevues] = useState(6);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const mutation = useMutation({
    mutationFn: (data: { zone_definition_id: string; seances_prevues: number }) =>
      api.addPatientZone(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      toast({
        title: "Zone ajoutée",
        description: "La zone de traitement a été ajoutée.",
      });
      setOpen(false);
      setSelectedZone("");
      setSeancesPrevues(6);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la zone.",
      });
    },
  });

  const availableZones = zones?.zones?.filter(
    (z: any) => !existingZones.some((ez) => ez.zone_definition_id === z.id)
  ) || [];

  const handleSubmit = () => {
    if (!selectedZone) return;
    mutation.mutate({
      zone_definition_id: selectedZone,
      seances_prevues: seancesPrevues,
    });
  };

  const selectedZoneName = availableZones.find((z: any) => z.id === selectedZone)?.nom;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12">
          <Plus className="h-5 w-5 mr-2" />
          Ajouter une zone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Ajouter une zone</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Zone Selection */}
          <div className="space-y-3">
            <Label className="text-base">Zone de traitement</Label>
            {availableZones.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableZones.map((zone: any) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone.id)}
                    className={cn(
                      "min-h-[56px] px-4 py-3 rounded-xl border-2 font-medium text-left transition-all active:scale-[0.98]",
                      selectedZone === zone.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    <span className="flex items-center justify-between">
                      {zone.nom}
                      {selectedZone === zone.id && (
                        <Check className="h-5 w-5 shrink-0" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Toutes les zones ont été ajoutées
              </div>
            )}
          </div>

          {/* Seances Count */}
          {selectedZone && (
            <div className="space-y-3">
              <Label className="text-base">Nombre de séances</Label>
              <div className="flex flex-wrap gap-2">
                {SEANCES_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSeancesPrevues(preset)}
                    className={cn(
                      "min-h-[52px] min-w-[52px] px-4 rounded-xl border-2 font-semibold text-lg transition-all active:scale-95",
                      seancesPrevues === preset
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom stepper */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSeancesPrevues(Math.max(1, seancesPrevues - 1))}
                  className="min-h-[52px] min-w-[52px] rounded-xl border-2 border-border bg-background text-2xl font-bold hover:bg-muted active:scale-95"
                >
                  -
                </button>
                <div className="flex-1 min-h-[52px] flex items-center justify-center rounded-xl border-2 border-border bg-muted/50 text-xl font-semibold">
                  {seancesPrevues} séances
                </div>
                <button
                  type="button"
                  onClick={() => setSeancesPrevues(Math.min(20, seancesPrevues + 1))}
                  className="min-h-[52px] min-w-[52px] rounded-xl border-2 border-border bg-background text-2xl font-bold hover:bg-muted active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 h-14 text-lg"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedZone || mutation.isPending}
            className="flex-1 h-14 text-lg"
          >
            {mutation.isPending ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
