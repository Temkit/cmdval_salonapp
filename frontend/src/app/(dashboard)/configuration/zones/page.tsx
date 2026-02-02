"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Target, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ZoneForm {
  nom: string;
  description: string;
  seances_recommandees: number;
}

const initialFormState: ZoneForm = {
  nom: "",
  description: "",
  seances_recommandees: 6,
};

export default function ZonesConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [formData, setFormData] = useState<ZoneForm>(initialFormState);
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone créée" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone mise à jour" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone supprimée" });
      setDeleteZoneId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingZone(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (zone: any) => {
    setEditingZone(zone);
    setFormData({
      nom: zone.nom,
      description: zone.description || "",
      seances_recommandees: zone.seances_recommandees || 6,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingZone(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nom: formData.nom,
      description: formData.description || null,
      seances_recommandees: formData.seances_recommandees,
    };

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const allZones = zones?.zones || [];
  const filteredZones = allZones.filter((zone: any) =>
    zone.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/configuration">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="heading-2">Zones</h1>
          <p className="text-sm text-muted-foreground">
            Definir les zones de traitement
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle zone
        </Button>
      </div>

      {/* Zones List */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base">Zones de traitement</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher une zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Chargement des zones">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl skeleton" />
                      <div className="space-y-2">
                        <div className="h-5 w-24 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-8 w-8 skeleton rounded" />
                      <div className="h-8 w-8 skeleton rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredZones.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredZones.map((zone: any) => (
                <div
                  key={zone.id}
                  className="p-4 border rounded-xl space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{zone.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.seances_recommandees} seances recommandees
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(zone)}
                        aria-label={`Modifier ${zone.nom}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteZoneId(zone.id)}
                        aria-label={`Supprimer ${zone.nom}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {zone.description && (
                    <p className="text-sm text-muted-foreground pl-13">
                      {zone.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : allZones.length > 0 && search ? (
            <EmptyState
              icon={Search}
              title="Aucun résultat"
              description={`Aucune zone ne correspond à "${search}"`}
              action={{
                label: "Effacer la recherche",
                onClick: () => setSearch(""),
              }}
            />
          ) : (
            <EmptyState
              icon={Target}
              title="Aucune zone définie"
              description="Définissez les zones de traitement disponibles pour vos patients"
              action={{
                label: "Créer une zone",
                onClick: handleOpenCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Modifier la zone" : "Nouvelle zone"}
              </DialogTitle>
              <DialogDescription>
                {editingZone
                  ? "Modifiez les informations de la zone de traitement."
                  : "Définissez une nouvelle zone de traitement."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la zone</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  placeholder="Ex: Aisselles"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seances_recommandees">
                  Nombre de séances recommandées
                </Label>
                <Input
                  id="seances_recommandees"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.seances_recommandees}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seances_recommandees: parseInt(e.target.value) || 6,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Notes ou informations supplémentaires..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Enregistrement..."
                  : editingZone
                  ? "Enregistrer"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteZoneId}
        onOpenChange={() => setDeleteZoneId(null)}
        title="Supprimer la zone"
        description="Les zones déjà assignées aux patients ne seront pas supprimées."
        itemName={
          deleteZoneId
            ? zones?.zones?.find((z: any) => z.id === deleteZoneId)?.nom
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleteZoneId && deleteMutation.mutate(deleteZoneId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
