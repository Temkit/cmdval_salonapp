import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  User,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Box } from "@/types";

export const Route = createFileRoute("/admin/config/boxes")({
  component: AdminBoxesPage,
});

function AdminBoxesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Box | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Box | null>(null);
  const [form, setForm] = useState({ nom: "", numero: "" });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api.getBoxes(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createBox({ nom: form.nom, numero: parseInt(form.numero) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Cabine creee" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateBox(editing!.id, { nom: form.nom, numero: parseInt(form.numero) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Cabine mise a jour" });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBox(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Cabine supprimee" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ nom: "", numero: "" });
  };

  const openCreate = () => {
    const boxes = data?.boxes ?? [];
    const nextNum = boxes.length > 0 ? Math.max(...boxes.map((b) => b.numero)) + 1 : 1;
    setForm({ nom: "", numero: nextNum.toString() });
    setDialogOpen(true);
  };

  const openEdit = (box: Box) => {
    setEditing(box);
    setForm({ nom: box.nom, numero: box.numero.toString() });
    setDialogOpen(true);
  };

  const boxes = data?.boxes ?? [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2">Cabines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {boxes.length} cabine{boxes.length !== 1 ? "s" : ""} configuree{boxes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle cabine
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Reessayer</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-20 skeleton rounded" /></CardContent></Card>
          ))}
        </div>
      ) : boxes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => {
            const isOccupied = !!box.current_user_id;
            return (
              <Card key={box.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                        {box.numero}
                      </Badge>
                      <span className="font-medium">{box.nom}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(box)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(box)}
                        disabled={isOccupied}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {isOccupied ? (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{box.current_user_name}</span>
                    </div>
                  ) : (
                    <Badge variant="success" dot>Disponible</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={DoorOpen}
          title="Aucune cabine"
          description="Ajoutez des cabines de traitement"
          action={{ label: "Nouvelle cabine", onClick: openCreate }}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la cabine" : "Nouvelle cabine"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editing ? updateMutation.mutate() : createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.numero}
                  onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  required
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Cabine 1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editing ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer la cabine"
        description={`Etes-vous sur de vouloir supprimer la cabine "${deleteTarget?.nom}" ?`}
        variant="danger"
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
