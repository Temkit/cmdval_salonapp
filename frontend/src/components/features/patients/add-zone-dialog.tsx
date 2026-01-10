"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AddZoneDialogProps {
  patientId: string;
  existingZones: Array<{ zone_definition_id: string }>;
}

export function AddZoneDialog({ patientId, existingZones }: AddZoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [seancesPrevues, setSeancesPrevues] = useState("6");
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
      setSeancesPrevues("6");
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
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    mutation.mutate({
      zone_definition_id: selectedZone,
      seances_prevues: parseInt(seancesPrevues),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une zone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une zone de traitement</DialogTitle>
            <DialogDescription>
              Sélectionnez une zone et le nombre de séances prévues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {availableZones?.map((zone: any) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seances">Nombre de séances prévues</Label>
              <Input
                id="seances"
                type="number"
                min="1"
                max="50"
                value={seancesPrevues}
                onChange={(e) => setSeancesPrevues(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedZone || mutation.isPending}>
              {mutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
