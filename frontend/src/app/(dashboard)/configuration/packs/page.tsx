"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Package, Target } from "lucide-react";
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
import type { Pack, ZoneDefinition, CreatePackRequest, UpdatePackRequest } from "@/types";

interface PackForm {
  nom: string;
  description: string;
  prix: string;
  duree_jours: string;
  seances_per_zone: string;
  zone_ids: string[];
}

const initialFormState: PackForm = {
  nom: "",
  description: "",
  prix: "",
  duree_jours: "",
  seances_per_zone: "6",
  zone_ids: [],
};

export default function PacksConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [formData, setFormData] = useState<PackForm>(initialFormState);
  const [deletePackId, setDeletePackId] = useState<string | null>(null);

  const { data: packsData, isLoading } = useQuery({
    queryKey: ["packs-config"],
    queryFn: () => api.getPacks(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePackRequest) => api.createPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs-config"] });
      toast({ title: "Pack créé" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackRequest }) =>
      api.updatePack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs-config"] });
      toast({ title: "Pack mis à jour" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs-config"] });
      toast({ title: "Pack supprimé" });
      setDeletePackId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingPack(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (pack: Pack) => {
    setEditingPack(pack);
    setFormData({
      nom: pack.nom,
      description: pack.description || "",
      prix: String(pack.prix),
      duree_jours: pack.duree_jours ? String(pack.duree_jours) : "",
      seances_per_zone: String(pack.seances_per_zone),
      zone_ids: pack.zone_ids || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPack(null);
    setFormData(initialFormState);
  };

  const toggleZone = (zoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      zone_ids: prev.zone_ids.includes(zoneId)
        ? prev.zone_ids.filter((id) => id !== zoneId)
        : [...prev.zone_ids, zoneId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shared = {
      nom: formData.nom,
      description: formData.description || null,
      prix: parseInt(formData.prix) || 0,
      duree_jours: formData.duree_jours ? parseInt(formData.duree_jours) : null,
      seances_per_zone: parseInt(formData.seances_per_zone) || 6,
      zone_ids: formData.zone_ids,
    };

    if (editingPack) {
      updateMutation.mutate({ id: editingPack.id, data: shared });
    } else {
      createMutation.mutate(shared);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const packs = packsData?.packs || [];
  const zones = zonesData?.zones || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/configuration"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="heading-2">Packs</h1>
          <p className="text-sm text-muted-foreground">Gérer les packs de traitement</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Packs de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-4 w-20 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : packs.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack: Pack) => (
                <div key={pack.id} className="p-4 border rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{pack.nom}</p>
                        <p className="text-sm font-semibold text-primary">{pack.prix.toLocaleString()} DA</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(pack)} aria-label={`Modifier ${pack.nom}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletePackId(pack.id)} aria-label={`Supprimer ${pack.nom}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.duree_jours && <Badge variant="secondary" size="sm">{pack.duree_jours} jours</Badge>}
                    <Badge variant="secondary" size="sm">{pack.seances_per_zone} séances/zone</Badge>
                    <Badge variant="outline" size="sm">{pack.zone_ids?.length || 0} zones</Badge>
                  </div>
                  {pack.description && (
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                  )}
                  {!pack.is_active && <Badge variant="secondary">Désactivé</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Aucun pack défini"
              description="Créez des packs de traitement pour vos patients"
              action={{ label: "Créer un pack", onClick: handleOpenCreate }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPack ? "Modifier le pack" : "Nouveau pack"}</DialogTitle>
              <DialogDescription>
                {editingPack ? "Modifiez les informations du pack." : "Créez un nouveau pack de traitement."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={formData.nom} onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (DA)</Label>
                  <Input id="prix" type="number" min="0" value={formData.prix} onChange={(e) => setFormData((p) => ({ ...p, prix: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_jours">Durée (jours)</Label>
                  <Input id="duree_jours" type="number" min="1" value={formData.duree_jours} onChange={(e) => setFormData((p) => ({ ...p, duree_jours: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seances">Séances/zone</Label>
                  <Input id="seances" type="number" min="1" value={formData.seances_per_zone} onChange={(e) => setFormData((p) => ({ ...p, seances_per_zone: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zones incluses</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-xl max-h-40 overflow-y-auto">
                  {zones.length > 0 ? zones.map((zone: ZoneDefinition) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => toggleZone(zone.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
                        formData.zone_ids.includes(zone.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Target className="h-3 w-3" />
                      {zone.nom}
                    </button>
                  )) : <p className="text-sm text-muted-foreground">Aucune zone disponible</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : editingPack ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletePackId}
        onOpenChange={() => setDeletePackId(null)}
        title="Supprimer le pack"
        description="Les souscriptions existantes ne seront pas affectées."
        itemName={deletePackId ? packs.find((p: Pack) => p.id === deletePackId)?.nom : undefined}
        confirmLabel="Supprimer"
        onConfirm={() => deletePackId && deleteMutation.mutate(deletePackId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
