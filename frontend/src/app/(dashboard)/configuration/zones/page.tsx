"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Target, Search, X, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { ZoneDefinition, CreateZoneRequest, UpdateZoneRequest, ZoneCategorie } from "@/types";

const CATEGORIES: { value: ZoneCategorie; label: string }[] = [
  { value: "visage", label: "Visage" },
  { value: "bras", label: "Bras" },
  { value: "jambes", label: "Jambes" },
  { value: "corps", label: "Corps" },
  { value: "homme", label: "Homme" },
];

interface ZoneForm {
  nom: string;
  description: string;
  prix: string;
  duree_minutes: string;
  categorie: string;
  is_homme: boolean;
}

const initialFormState: ZoneForm = {
  nom: "",
  description: "",
  prix: "",
  duree_minutes: "",
  categorie: "",
  is_homme: false,
};

export default function ZonesConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneDefinition | null>(null);
  const [formData, setFormData] = useState<ZoneForm>(initialFormState);
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateZoneRequest) => api.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone créée" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZoneRequest }) =>
      api.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone mise à jour" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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

  const handleOpenEdit = (zone: ZoneDefinition) => {
    setEditingZone(zone);
    setFormData({
      nom: zone.nom,
      description: zone.description || "",
      prix: zone.prix != null ? String(zone.prix) : "",
      duree_minutes: zone.duree_minutes != null ? String(zone.duree_minutes) : "",
      categorie: zone.categorie || "",
      is_homme: zone.is_homme,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingZone(null);
    setFormData(initialFormState);
  };

  const handleCategorieChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categorie: value,
      is_homme: value === "homme" ? true : prev.is_homme,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shared = {
      nom: formData.nom,
      description: formData.description || null,
      prix: formData.prix ? parseInt(formData.prix) : null,
      duree_minutes: formData.duree_minutes ? parseInt(formData.duree_minutes) : null,
      categorie: (formData.categorie || null) as ZoneCategorie | null,
      is_homme: formData.is_homme,
    };

    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data: shared });
    } else {
      const data: CreateZoneRequest = {
        code: formData.nom.toLowerCase().replace(/\s+/g, "_"),
        ...shared,
      };
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const allZones = zones?.zones || [];
  const filteredZones = allZones.filter((zone: ZoneDefinition) =>
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
              {filteredZones.map((zone: ZoneDefinition) => (
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
                        <div className="flex items-center gap-2 mt-0.5">
                          {zone.prix != null && (
                            <span className="text-sm text-muted-foreground flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {zone.prix} DA
                            </span>
                          )}
                          {zone.duree_minutes != null && (
                            <span className="text-sm text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {zone.duree_minutes} min
                            </span>
                          )}
                        </div>
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
                  <div className="flex flex-wrap gap-1 pl-13">
                    {zone.categorie && (
                      <Badge variant="secondary" size="sm">{zone.categorie}</Badge>
                    )}
                    {zone.is_homme && (
                      <Badge variant="outline" size="sm">Homme</Badge>
                    )}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (DA)</Label>
                  <Input
                    id="prix"
                    type="number"
                    min="0"
                    value={formData.prix}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, prix: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_minutes">Durée (min)</Label>
                  <Input
                    id="duree_minutes"
                    type="number"
                    min="1"
                    value={formData.duree_minutes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, duree_minutes: e.target.value }))
                    }
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={handleCategorieChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_homme}
                  onClick={() => setFormData((prev) => ({ ...prev, is_homme: !prev.is_homme }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    formData.is_homme ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform ${
                      formData.is_homme ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <Label className="cursor-pointer" onClick={() => setFormData((prev) => ({ ...prev, is_homme: !prev.is_homme }))}>
                  Homme uniquement
                </Label>
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
            ? zones?.zones?.find((z: ZoneDefinition) => z.id === deleteZoneId)?.nom
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
