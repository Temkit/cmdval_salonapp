"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, Tag, Percent, X, Search } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

interface PromotionForm {
  nom: string;
  description: string;
  type: "pourcentage" | "montant";
  valeur: number;
  date_debut: string;
  date_fin: string;
  zone_ids: string[];
}

const initialFormState: PromotionForm = {
  nom: "",
  description: "",
  type: "pourcentage",
  valeur: 0,
  date_debut: "",
  date_fin: "",
  zone_ids: [],
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " DA";
}

function getPromotionStatus(promo: any): { label: string; variant: "success" | "info" | "muted" } {
  const now = new Date();
  const start = promo.date_debut ? new Date(promo.date_debut) : null;
  const end = promo.date_fin ? new Date(promo.date_fin) : null;

  if (promo.is_active === false) {
    return { label: "Inactive", variant: "muted" };
  }

  if (end && end < now) {
    return { label: "Expiree", variant: "muted" };
  }

  if (start && start > now) {
    return { label: "A venir", variant: "info" };
  }

  return { label: "Active", variant: "success" };
}

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export default function PromotionsConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [formData, setFormData] = useState<PromotionForm>(initialFormState);
  const [deletePromoId, setDeletePromoId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: promotionsData, isLoading: promosLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: () => api.getPromotions(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion creee" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion mise a jour" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion desactivee" });
      setDeletePromoId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (promo: any) => {
    setEditingPromo(promo);
    setFormData({
      nom: promo.nom || "",
      description: promo.description || "",
      type: promo.type || "pourcentage",
      valeur: promo.valeur || 0,
      date_debut: formatDateForInput(promo.date_debut || ""),
      date_fin: formatDateForInput(promo.date_fin || ""),
      zone_ids: promo.zone_ids || promo.zones?.map((z: any) => z.id || z.zone_id) || [],
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPromo(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nom: formData.nom,
      description: formData.description || null,
      type: formData.type,
      valeur: formData.valeur,
      date_debut: formData.date_debut || null,
      date_fin: formData.date_fin || null,
      zone_ids: formData.zone_ids,
    };

    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data });
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
  const promotions = promotionsData?.promotions || [];
  const zones = zonesData?.zones || [];
  const filteredPromotions = promotions.filter((promo: any) =>
    promo.nom.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="heading-2">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Gerer les promotions et reductions
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base">Liste des promotions</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher une promotion..."
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
          {promosLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Chargement des promotions">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-5 w-24 skeleton rounded" />
                  <div className="flex-1" />
                  <div className="h-6 w-16 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredPromotions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valeur</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Periode</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Zones</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((promo: any) => {
                    const status = getPromotionStatus(promo);
                    const promoZones = promo.zones || [];

                    return (
                      <tr key={promo.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-rose-500 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{promo.nom}</p>
                              {promo.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{promo.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {promo.type === "pourcentage" ? "Pourcentage" : "Montant fixe"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-bold text-primary">
                            {promo.type === "pourcentage"
                              ? `${promo.valeur}%`
                              : formatPrice(promo.valeur)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="text-sm text-muted-foreground">
                            {promo.date_debut ? formatDate(promo.date_debut) : "-"}
                            {" - "}
                            {promo.date_fin ? formatDate(promo.date_fin) : "-"}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {promoZones.length > 0 ? (
                              promoZones.slice(0, 3).map((z: any) => (
                                <Badge key={z.id || z.zone_id} variant="secondary" size="sm">
                                  {z.nom || z.zone_nom}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Toutes</span>
                            )}
                            {promoZones.length > 3 && (
                              <Badge variant="muted" size="sm">
                                +{promoZones.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={status.variant} dot>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(promo)}
                              aria-label={`Modifier ${promo.nom}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {promo.is_active !== false && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletePromoId(promo.id)}
                                aria-label={`Desactiver ${promo.nom}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : promotions.length > 0 && search ? (
            <EmptyState
              icon={Search}
              title="Aucun resultat"
              description={`Aucune promotion ne correspond a "${search}"`}
              action={{
                label: "Effacer la recherche",
                onClick: () => setSearch(""),
              }}
            />
          ) : (
            <EmptyState
              icon={Tag}
              title="Aucune promotion"
              description="Creez des promotions pour offrir des reductions sur les zones de traitement"
              action={{
                label: "Creer une promotion",
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
                {editingPromo ? "Modifier la promotion" : "Nouvelle promotion"}
              </DialogTitle>
              <DialogDescription>
                {editingPromo
                  ? "Modifiez les informations de la promotion."
                  : "Definissez une nouvelle promotion."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la promotion</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Promo ete 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Details de la promotion..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de reduction</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as "pourcentage" | "montant" }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="pourcentage">Pourcentage (%)</option>
                    <option value="montant">Montant fixe (DA)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valeur">
                    Valeur {formData.type === "pourcentage" ? "(%)" : "(DA)"}
                  </Label>
                  <Input
                    id="valeur"
                    type="number"
                    min="0"
                    max={formData.type === "pourcentage" ? 100 : undefined}
                    step={formData.type === "pourcentage" ? 1 : 100}
                    value={formData.valeur}
                    onChange={(e) => setFormData((prev) => ({ ...prev, valeur: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de debut</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date_debut: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date de fin</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date_fin: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zones concernees (optionnel)</Label>
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour appliquer a toutes les zones
                </p>
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {formData.zone_ids.length} zone(s) selectionnee(s)
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, zone_ids: [] }))}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout deselectionner
                    </button>
                  </div>
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
                  : editingPromo
                  ? "Enregistrer"
                  : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePromoId}
        onOpenChange={() => setDeletePromoId(null)}
        title="Desactiver la promotion"
        description="La promotion sera desactivee et ne sera plus appliquee sur les prix."
        itemName={
          deletePromoId
            ? promotions.find((p: any) => p.id === deletePromoId)?.nom
            : undefined
        }
        confirmLabel="Desactiver"
        onConfirm={() => deletePromoId && deleteMutation.mutate(deletePromoId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
