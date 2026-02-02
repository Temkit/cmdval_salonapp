"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Package, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

interface PackForm {
  nom: string;
  description: string;
  prix: number;
  duree_jours: number;
  seances_per_zone: number;
  zone_ids: string[];
}

const initialFormState: PackForm = {
  nom: "",
  description: "",
  prix: 0,
  duree_jours: 365,
  seances_per_zone: 6,
  zone_ids: [],
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " DA";
}

export default function PacksConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<any>(null);
  const [formData, setFormData] = useState<PackForm>(initialFormState);
  const [deletePackId, setDeletePackId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: packsData, isLoading: packsLoading } = useQuery({
    queryKey: ["packs"],
    queryFn: () => api.getPacks(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack cree" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack mis a jour" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack desactive" });
      setDeletePackId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingPack(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (pack: any) => {
    setEditingPack(pack);
    setFormData({
      nom: pack.nom || "",
      description: pack.description || "",
      prix: pack.prix || 0,
      duree_jours: pack.duree_jours || 365,
      seances_per_zone: pack.seances_per_zone || 6,
      zone_ids: pack.zone_ids || pack.zones?.map((z: any) => z.id || z.zone_id) || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPack(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nom: formData.nom,
      description: formData.description || null,
      prix: formData.prix,
      duree_jours: formData.duree_jours,
      seances_per_zone: formData.seances_per_zone,
      zone_ids: formData.zone_ids,
    };

    if (editingPack) {
      updateMutation.mutate({ id: editingPack.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleZone = (zoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      zone_ids: prev.zone_ids.includes(zoneId)
        ? prev.zone_ids.filter((id) => id !== zoneId)
        : [...prev.zone_ids, zoneId],
    }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const packs = packsData?.packs || [];
  const zones = zonesData?.zones || [];
  const filteredPacks = packs.filter((pack: any) =>
    pack.nom.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="heading-2">Packs</h1>
          <p className="text-sm text-muted-foreground">
            Gerer les packs de seances
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
        </Button>
      </div>

      {/* Packs List */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base">Packs de seances</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un pack..."
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
          {packsLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Chargement des packs">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl skeleton" />
                      <div className="space-y-2">
                        <div className="h-5 w-28 skeleton rounded" />
                        <div className="h-4 w-20 skeleton rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-full skeleton rounded" />
                    <div className="h-4 w-2/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPacks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPacks.map((pack: any) => {
                const packZones = pack.zones || [];
                const isActive = pack.is_active !== false;

                return (
                  <div
                    key={pack.id}
                    className={`p-4 border rounded-xl space-y-3 ${!isActive ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium">{pack.nom}</p>
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(pack.prix)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(pack)}
                          aria-label={`Modifier ${pack.nom}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePackId(pack.id)}
                            aria-label={`Desactiver ${pack.nom}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {pack.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {pack.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duree</span>
                        <span className="font-medium">{pack.duree_jours} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seances/zone</span>
                        <span className="font-medium">{pack.seances_per_zone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge variant={isActive ? "success" : "muted"} dot>
                          {isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>

                    {packZones.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Zones incluses</p>
                        <div className="flex flex-wrap gap-1">
                          {packZones.map((z: any) => (
                            <Badge key={z.id || z.zone_id} variant="secondary" size="sm">
                              {z.nom || z.zone_nom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : packs.length > 0 && search ? (
            <EmptyState
              icon={Search}
              title="Aucun resultat"
              description={`Aucun pack ne correspond a "${search}"`}
              action={{
                label: "Effacer la recherche",
                onClick: () => setSearch(""),
              }}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="Aucun pack defini"
              description="Creez des packs de seances pour proposer des offres a vos patients"
              action={{
                label: "Creer un pack",
                onClick: handleOpenCreate,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPack ? "Modifier le pack" : "Nouveau pack"}
              </DialogTitle>
              <DialogDescription>
                {editingPack
                  ? "Modifiez les informations du pack."
                  : "Definissez un nouveau pack de seances."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du pack</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Pack Premium 10 zones"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du pack..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (DA)</Label>
                  <Input
                    id="prix"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.prix}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prix: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duree_jours">Duree (jours)</Label>
                  <Input
                    id="duree_jours"
                    type="number"
                    min="1"
                    max="3650"
                    value={formData.duree_jours}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duree_jours: parseInt(e.target.value) || 365 }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seances_per_zone">Seances par zone</Label>
                <Input
                  id="seances_per_zone"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.seances_per_zone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seances_per_zone: parseInt(e.target.value) || 6 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Zones incluses</Label>
                {zones.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {zones.map((zone: any) => {
                      const isSelected = formData.zone_ids.includes(zone.id);
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => handleToggleZone(zone.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                            {isSelected && (
                              <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{zone.nom}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune zone disponible</p>
                )}
                {formData.zone_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.zone_ids.length} zone(s) selectionnee(s)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Enregistrement..."
                  : editingPack
                  ? "Enregistrer"
                  : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePackId}
        onOpenChange={() => setDeletePackId(null)}
        title="Desactiver le pack"
        description="Le pack sera desactive et ne sera plus disponible pour de nouvelles souscriptions. Les souscriptions existantes ne seront pas affectees."
        itemName={
          deletePackId
            ? packs.find((p: any) => p.id === deletePackId)?.nom
            : undefined
        }
        confirmLabel="Desactiver"
        onConfirm={() => deletePackId && deleteMutation.mutate(deletePackId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
