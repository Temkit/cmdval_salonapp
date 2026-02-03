"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Percent, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDate } from "@/lib/utils";
import type { Promotion, ZoneDefinition, CreatePromotionRequest, UpdatePromotionRequest, PromotionType } from "@/types";

interface PromoForm {
  nom: string;
  type: PromotionType;
  valeur: string;
  zone_ids: string[];
  date_debut: string;
  date_fin: string;
}

const initialFormState: PromoForm = {
  nom: "",
  type: "pourcentage",
  valeur: "",
  zone_ids: [],
  date_debut: "",
  date_fin: "",
};

export default function PromotionsConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromoForm>(initialFormState);
  const [deletePromoId, setDeletePromoId] = useState<string | null>(null);

  const { data: promosData, isLoading } = useQuery({
    queryKey: ["promotions-config"],
    queryFn: () => api.getPromotions(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionRequest) => api.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-config"] });
      toast({ title: "Promotion créée" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      api.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-config"] });
      toast({ title: "Promotion mise à jour" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-config"] });
      toast({ title: "Promotion supprimée" });
      setDeletePromoId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      nom: promo.nom,
      type: promo.type,
      valeur: String(promo.valeur),
      zone_ids: promo.zone_ids || [],
      date_debut: promo.date_debut ? promo.date_debut.split("T")[0] : "",
      date_fin: promo.date_fin ? promo.date_fin.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromo(null);
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
      type: formData.type,
      valeur: parseFloat(formData.valeur) || 0,
      zone_ids: formData.zone_ids,
      date_debut: formData.date_debut || null,
      date_fin: formData.date_fin || null,
    };

    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data: shared });
    } else {
      createMutation.mutate(shared);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const promotions = promosData?.promotions || [];
  const zones = zonesData?.zones || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/configuration"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="heading-2">Promotions</h1>
          <p className="text-sm text-muted-foreground">Gérer les promotions actives</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              ))}
            </div>
          ) : promotions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promo: Promotion) => (
                <div key={promo.id} className="p-4 border rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Percent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{promo.nom}</p>
                        <p className="text-sm font-semibold text-primary">
                          {promo.type === "pourcentage" ? `-${promo.valeur}%` : `-${promo.valeur} DA`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(promo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletePromoId(promo.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {promo.is_currently_active ? (
                      <Badge variant="success" size="sm" dot>Active</Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">Inactive</Badge>
                    )}
                    <Badge variant="outline" size="sm">{promo.zone_ids?.length || 0} zones</Badge>
                  </div>
                  {(promo.date_debut || promo.date_fin) && (
                    <p className="text-xs text-muted-foreground">
                      {promo.date_debut && formatDate(promo.date_debut)}
                      {promo.date_fin && ` → ${formatDate(promo.date_fin)}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Percent}
              title="Aucune promotion"
              description="Créez des promotions pour vos zones de traitement"
              action={{ label: "Créer une promotion", onClick: handleOpenCreate }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Modifier la promotion" : "Nouvelle promotion"}</DialogTitle>
              <DialogDescription>
                {editingPromo ? "Modifiez les paramètres de la promotion." : "Créez une nouvelle promotion."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={formData.nom} onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: v as PromotionType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pourcentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="montant">Montant (DA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valeur">Valeur</Label>
                  <Input id="valeur" type="number" min="0" value={formData.valeur} onChange={(e) => setFormData((p) => ({ ...p, valeur: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date début</Label>
                  <Input id="date_debut" type="date" value={formData.date_debut} onChange={(e) => setFormData((p) => ({ ...p, date_debut: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date fin</Label>
                  <Input id="date_fin" type="date" value={formData.date_fin} onChange={(e) => setFormData((p) => ({ ...p, date_fin: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zones concernées</Label>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enregistrement..." : editingPromo ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletePromoId}
        onOpenChange={() => setDeletePromoId(null)}
        title="Supprimer la promotion"
        description="La promotion sera désactivée."
        itemName={deletePromoId ? promotions.find((p: Promotion) => p.id === deletePromoId)?.nom : undefined}
        confirmLabel="Supprimer"
        onConfirm={() => deletePromoId && deleteMutation.mutate(deletePromoId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
