import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ZoneDefinition, ZoneCategorie } from "@/types";

export const Route = createFileRoute("/admin/config/zones")({
  component: AdminZonesPage,
});

const CATEGORIES: { value: ZoneCategorie; label: string }[] = [
  { value: "visage", label: "Visage" },
  { value: "bras", label: "Bras" },
  { value: "jambes", label: "Jambes" },
  { value: "corps", label: "Corps" },
  { value: "homme", label: "Homme" },
];

function AdminZonesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneDefinition | null>(null);
  const [form, setForm] = useState({
    code: "",
    nom: "",
    description: "",
    prix: "",
    duree_minutes: "",
    categorie: "" as string,
    ordre: "0",
    is_homme: false,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["zones", true],
    queryFn: () => api.getZones(true),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createZone({
        code: form.code,
        nom: form.nom,
        description: form.description || null,
        prix: form.prix ? parseFloat(form.prix) : null,
        duree_minutes: form.duree_minutes
          ? parseInt(form.duree_minutes)
          : null,
        categorie: (form.categorie as ZoneCategorie) || null,
        ordre: parseInt(form.ordre) || 0,
        is_homme: form.is_homme,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone creee" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateZone(editingZone!.id, {
        code: form.code,
        nom: form.nom,
        description: form.description || null,
        prix: form.prix ? parseFloat(form.prix) : null,
        duree_minutes: form.duree_minutes
          ? parseInt(form.duree_minutes)
          : null,
        categorie: (form.categorie as ZoneCategorie) || null,
        ordre: parseInt(form.ordre) || 0,
        is_homme: form.is_homme,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone mise a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({ title: "Zone supprimee" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingZone(null);
    setForm({
      code: "",
      nom: "",
      description: "",
      prix: "",
      duree_minutes: "",
      categorie: "",
      ordre: "0",
      is_homme: false,
    });
  };

  const openEdit = (zone: ZoneDefinition) => {
    setEditingZone(zone);
    setForm({
      code: zone.code,
      nom: zone.nom,
      description: zone.description ?? "",
      prix: zone.prix?.toString() ?? "",
      duree_minutes: zone.duree_minutes?.toString() ?? "",
      categorie: zone.categorie ?? "",
      ordre: zone.ordre?.toString() ?? "0",
      is_homme: zone.is_homme,
    });
    setDialogOpen(true);
  };

  const zones = data?.zones ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Zones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {zones.length} zone{zones.length !== 1 ? "s" : ""} configuree{zones.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle zone
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
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-48 skeleton rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : zones.length > 0 ? (
        <div className="space-y-2">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{zone.nom}</p>
                      <Badge variant="outline" size="sm">
                        {zone.code}
                      </Badge>
                      {!zone.is_active && (
                        <Badge variant="muted" size="sm">
                          Inactif
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {zone.categorie && `${zone.categorie} · `}
                      {zone.prix != null ? `${zone.prix} DA` : "Prix non defini"}
                      {zone.duree_minutes != null && ` · ${zone.duree_minutes} min`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(zone)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (confirm("Supprimer cette zone ?")) {
                          deleteMutation.mutate(zone.id);
                        }
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
          icon={MapPin}
          title="Aucune zone"
          description="Commencez par creer des zones de traitement"
          action={{ label: "Nouvelle zone", onClick: () => setDialogOpen(true) }}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Modifier la zone" : "Nouvelle zone"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingZone) {
                updateMutation.mutate();
              } else {
                createMutation.mutate();
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="EX: VIS_01"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix (DA)</Label>
                <Input
                  type="number"
                  value={form.prix}
                  onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duree (min)</Label>
                <Input
                  type="number"
                  value={form.duree_minutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duree_minutes: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input
                  type="number"
                  value={form.ordre}
                  onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categorie</Label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={form.categorie === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        categorie: f.categorie === cat.value ? "" : cat.value,
                      }))
                    }
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_homme"
                checked={form.is_homme}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_homme: e.target.checked }))
                }
                className="rounded"
              />
              <Label htmlFor="is_homme" className="text-sm font-normal">
                Zone specifique homme
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editingZone
                    ? "Mettre a jour"
                    : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
