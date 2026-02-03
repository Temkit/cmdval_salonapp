"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, DoorOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Box, BoxCreateRequest, BoxUpdateRequest } from "@/types";

interface BoxForm {
  nom: string;
  numero: number;
}

const initialFormState: BoxForm = {
  nom: "",
  numero: 1,
};

export default function BoxesConfigPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [formData, setFormData] = useState<BoxForm>(initialFormState);
  const [deleteBoxId, setDeleteBoxId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api.getBoxes(),
  });

  const createMutation = useMutation({
    mutationFn: (data: BoxCreateRequest) => api.createBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Box cree" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoxUpdateRequest }) =>
      api.updateBox(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Box mis a jour" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBox(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Box supprime" });
      setDeleteBoxId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setEditingBox(null);
    const boxes = data?.boxes || [];
    const maxNumero = boxes.reduce((max: number, b: Box) => Math.max(max, b.numero), 0);
    setFormData({ nom: `Box ${maxNumero + 1}`, numero: maxNumero + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (box: Box) => {
    setEditingBox(box);
    setFormData({ nom: box.nom, numero: box.numero });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBox(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBox) {
      updateMutation.mutate({
        id: editingBox.id,
        data: { nom: formData.nom, numero: formData.numero },
      });
    } else {
      createMutation.mutate({ nom: formData.nom, numero: formData.numero });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const boxes = data?.boxes || [];

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
          <h1 className="heading-2">Boxes</h1>
          <p className="text-sm text-muted-foreground">
            Gerer les salles de traitement
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau box
        </Button>
      </div>

      {/* Boxes List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Salles de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl skeleton" />
                      <div className="space-y-2">
                        <div className="h-5 w-20 skeleton rounded" />
                        <div className="h-4 w-28 skeleton rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : boxes.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {boxes.map((box: Box) => (
                <div
                  key={box.id}
                  className="p-4 border rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{box.numero}</span>
                      </div>
                      <div>
                        <p className="font-medium">{box.nom}</p>
                        {box.current_user_name ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{box.current_user_name}</span>
                          </div>
                        ) : (
                          <Badge variant="success" className="text-xs">Disponible</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(box)}
                        aria-label={`Modifier ${box.nom}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteBoxId(box.id)}
                        aria-label={`Supprimer ${box.nom}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {!box.is_active && (
                    <Badge variant="secondary">Desactive</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={DoorOpen}
              title="Aucun box defini"
              description="Creez des boxes pour organiser vos salles de traitement"
              action={{
                label: "Creer un box",
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
                {editingBox ? "Modifier le box" : "Nouveau box"}
              </DialogTitle>
              <DialogDescription>
                {editingBox
                  ? "Modifiez les informations du box."
                  : "Creez une nouvelle salle de traitement."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nom: e.target.value }))
                  }
                  placeholder="Ex: Box 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Numero</Label>
                <Input
                  id="numero"
                  type="number"
                  min="1"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      numero: parseInt(e.target.value) || 1,
                    }))
                  }
                  required
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
                  : editingBox
                  ? "Enregistrer"
                  : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteBoxId}
        onOpenChange={() => setDeleteBoxId(null)}
        title="Supprimer le box"
        description="Le box ne peut pas etre supprime s'il est actuellement occupe."
        itemName={
          deleteBoxId
            ? boxes.find((b: Box) => b.id === deleteBoxId)?.nom
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleteBoxId && deleteMutation.mutate(deleteBoxId)}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
