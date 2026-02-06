import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
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
import type { Pack } from "@/types";

export const Route = createFileRoute("/admin/config/packs")({
  component: AdminPacksPage,
});

function AdminPacksPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    prix: "",
    seances_per_zone: "6",
    duree_jours: "",
    zone_ids: [] as string[],
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["packs", true],
    queryFn: () => api.getPacks(true),
  });

  const { data: zonesData } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.getZones(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPack({
        nom: form.nom,
        description: form.description || null,
        prix: parseFloat(form.prix),
        seances_per_zone: parseInt(form.seances_per_zone),
        duree_jours: form.duree_jours ? parseInt(form.duree_jours) : null,
        zone_ids: form.zone_ids,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack cree" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updatePack(editingPack!.id, {
        nom: form.nom,
        description: form.description || null,
        prix: parseFloat(form.prix),
        seances_per_zone: parseInt(form.seances_per_zone),
        duree_jours: form.duree_jours ? parseInt(form.duree_jours) : null,
        zone_ids: form.zone_ids,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack mis a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
      toast({ title: "Pack supprime" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPack(null);
    setForm({
      nom: "",
      description: "",
      prix: "",
      seances_per_zone: "6",
      duree_jours: "",
      zone_ids: [],
    });
  };

  const openEdit = (pack: Pack) => {
    setEditingPack(pack);
    setForm({
      nom: pack.nom,
      description: pack.description ?? "",
      prix: pack.prix.toString(),
      seances_per_zone: pack.seances_per_zone.toString(),
      duree_jours: pack.duree_jours?.toString() ?? "",
      zone_ids: pack.zone_ids,
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

  const packs = data?.packs ?? [];
  const zones = zonesData?.zones ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Packs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {packs.length} pack{packs.length !== 1 ? "s" : ""} configure{packs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau pack
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
      ) : packs.length > 0 ? (
        <div className="space-y-2">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{pack.nom}</p>
                      {!pack.is_active && (
                        <Badge variant="muted" size="sm">Inactif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pack.prix} DA · {pack.seances_per_zone} seances/zone · {pack.zone_ids.length} zones
                      {pack.duree_jours != null && ` · ${pack.duree_jours} jours`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(pack)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (confirm("Supprimer ce pack ?")) deleteMutation.mutate(pack.id);
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
          icon={Package}
          title="Aucun pack"
          description="Creez des packs de seances"
          action={{ label: "Nouveau pack", onClick: () => setDialogOpen(true) }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPack ? "Modifier le pack" : "Nouveau pack"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editingPack ? updateMutation.mutate() : createMutation.mutate();
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
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix (DA)</Label>
                <Input
                  type="number"
                  required
                  value={form.prix}
                  onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Seances/zone</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={form.seances_per_zone}
                  onChange={(e) => setForm((f) => ({ ...f, seances_per_zone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duree (jours)</Label>
                <Input
                  type="number"
                  value={form.duree_jours}
                  onChange={(e) => setForm((f) => ({ ...f, duree_jours: e.target.value }))}
                  placeholder="Illimite"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zones incluses ({form.zone_ids.length})</Label>
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
                  : editingPack ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
