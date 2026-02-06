import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Percent,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Promotion, PromotionType } from "@/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/config/promotions")({
  component: AdminPromotionsPage,
});

function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    nom: "",
    type: "pourcentage" as PromotionType,
    valeur: "",
    date_debut: "",
    date_fin: "",
    zone_ids: [] as string[],
    is_active: true,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["promotions", true],
    queryFn: () => api.getPromotions(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPromotion({
        nom: form.nom,
        type: form.type,
        valeur: parseFloat(form.valeur),
        zone_ids: form.zone_ids,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion creee" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updatePromotion(editingPromo!.id, {
        nom: form.nom,
        type: form.type,
        valeur: parseFloat(form.valeur),
        zone_ids: form.zone_ids,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion mise a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      toast({ title: "Promotion supprimee" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPromo(null);
    setForm({
      nom: "",
      type: "pourcentage",
      valeur: "",
      date_debut: "",
      date_fin: "",
      zone_ids: [],
      is_active: true,
    });
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setForm({
      nom: promo.nom,
      type: promo.type,
      valeur: promo.valeur.toString(),
      date_debut: promo.date_debut ?? "",
      date_fin: promo.date_fin ?? "",
      zone_ids: promo.zone_ids,
      is_active: promo.is_active,
    });
    setDialogOpen(true);
  };

  const toggleZone = (zoneId: string) => {
    setForm((f) => ({
      ...f,
      zone_ids: f.zone_ids.includes(zoneId)
        ? f.zone_ids.filter((id) => id !== zoneId)
        : [...f.zone_ids, zoneId],
    }));
  };

  const promotions = data?.promotions ?? [];
  const zones = zonesData?.zones ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {promotions.length} promotion{promotions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-48 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : promotions.length > 0 ? (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Percent className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{promo.nom}</p>
                      <Badge
                        variant={promo.is_currently_active ? "success" : "muted"}
                        size="sm"
                      >
                        {promo.is_currently_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {promo.type === "pourcentage"
                        ? `${promo.valeur}%`
                        : `${promo.valeur} DA`}
                      {" · "}
                      {promo.zone_ids.length} zone{promo.zone_ids.length !== 1 ? "s" : ""}
                      {promo.date_debut && ` · Du ${formatDate(promo.date_debut)}`}
                      {promo.date_fin && ` au ${formatDate(promo.date_fin)}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(promo)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (confirm("Supprimer cette promotion ?")) deleteMutation.mutate(promo.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Percent}
          title="Aucune promotion"
          description="Creez des promotions pour vos zones"
          action={{ label: "Nouvelle promotion", onClick: () => setDialogOpen(true) }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? "Modifier la promotion" : "Nouvelle promotion"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingPromo ? updateMutation.mutate() : createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                required
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.type === "pourcentage" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setForm((f) => ({ ...f, type: "pourcentage" }))}
                  >
                    Pourcentage
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === "montant" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setForm((f) => ({ ...f, type: "montant" }))}
                  >
                    Montant
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valeur {form.type === "pourcentage" ? "(%)" : "(DA)"}</Label>
                <Input
                  type="number"
                  required
                  value={form.valeur}
                  onChange={(e) => setForm((f) => ({ ...f, valeur: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date debut</Label>
                <Input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zones ({form.zone_ids.length})</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => toggleZone(zone.id)}
                    className={`text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                      form.zone_ids.includes(zone.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    {zone.nom}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editingPromo ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
